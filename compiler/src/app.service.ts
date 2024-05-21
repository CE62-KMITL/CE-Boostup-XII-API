import * as fs from 'fs';
import { join } from 'path';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigConstants } from './config/config-constants';
import {
  CompileAndRunDto,
  CompileAndRunOutput,
  CompileAndRunResponse,
} from './dto/compile-and-run.dto';
import { ResultCode } from './enums/result-code.enum';
import { WarningLevel } from './enums/warning-level.enum';
import { ExecutionResult, Executor } from './executor';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {
    this.executor = new Executor(
      ConfigConstants.isolate.box_root,
      this.configService.getOrThrow<number>('isolate.boxCount'),
      join(
        this.configService.getOrThrow<string>('storages.temporary.path'),
        'metadata',
      ),
    );
  }

  private requestId = 0;

  private readonly logger = new Logger(AppService.name);
  private readonly executor: Executor;

  onModuleInit(): void {
    this.createTemporaryDirectories();
  }

  private async createTemporaryDirectories(): Promise<void> {
    for (const path of ['executables', 'metadata']) {
      await fs.promises.mkdir(
        join(
          this.configService.getOrThrow<string>('storages.temporary.path'),
          path,
        ),
        { recursive: true },
      );
    }
  }

  getRoot(): string {
    return 'Swagger UI is available at <a href="/api">/api</a>';
  }

  async getBoxStatuses(): Promise<{ total: number; available: number[] }> {
    const { total, available } = await this.executor.getBoxStatuses();
    return {
      total,
      available: available.toSorted((a, b) => a - b),
    };
  }

  async compileAndRun(
    compileAndRunDto: CompileAndRunDto,
  ): Promise<CompileAndRunResponse> {
    const requestId = this.requestId++;
    const isCpp = compileAndRunDto.language.includes('++');
    const compiler = isCpp ? 'g++' : 'gcc';
    const codeFilename = isCpp ? 'code.cpp' : 'code.c';
    const warningString =
      compileAndRunDto.warningLevel === WarningLevel.Default
        ? ''
        : `-W${compileAndRunDto.warningLevel}`;
    const compilationWallTimeLimit = Math.max(
      compileAndRunDto.compilationTimeLimit * 4,
      compileAndRunDto.compilationTimeLimit + 30,
    );
    const wallTimeLimit = Math.max(
      compileAndRunDto.timeLimit * 4,
      compileAndRunDto.timeLimit + 30,
    );
    const hoistResult = this.hoistIncludes(compileAndRunDto.code);
    let code = hoistResult.code;
    const includeCount = hoistResult.includeCount;
    const {
      exitCode: preCompilationExitCode,
      isolateOutput: preCompilationIsolateOutput,
      output: precompilationOutput,
      metadata: precompilationMetadata,
    } = await this.executor.execute(
      [
        `/usr/bin/${compiler}`,
        '-pass-exit-codes',
        `-fdiagnostics-color=${compileAndRunDto.formattedDiagnostic ? 'always' : 'never'}`,
        `-fdiagnostics-urls=${compileAndRunDto.formattedDiagnostic ? 'always' : 'never'}`,
        `--std=${compileAndRunDto.language}`,
        `${codeFilename}`,
        '-H',
      ],
      -requestId,
      {
        inputTexts: [{ name: codeFilename, text: code }],
        processLimit: null,
        environment: {
          PATH: '/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin',
        },
        memoryLimit: compileAndRunDto.compilationMemoryLimit,
        timeLimit: compileAndRunDto.compilationTimeLimit,
        wallTimeLimit: compilationWallTimeLimit,
        fileSizeLimit: ConfigConstants.compiler.maxExecutableSize,
      },
    );
    if (preCompilationExitCode !== 0) {
      const exitSignal = precompilationMetadata.exitsig
        ? +precompilationMetadata.exitsig
        : 0;
      let returnCode = ResultCode.CE;
      if (
        precompilationOutput.includes('memory exhausted') ||
        precompilationOutput.includes(
          'Segmentation fault signal terminated program',
        ) ||
        exitSignal === 11 ||
        exitSignal === 127
      ) {
        returnCode = ResultCode.CMLE;
      }
      if (precompilationOutput.includes('File size limit exceeded')) {
        returnCode = ResultCode.COLE;
      }
      if (precompilationMetadata.status === 'TO') {
        returnCode = ResultCode.CTLE;
      }
      const outputLines = precompilationOutput.split('\n');
      let lastHeaderLine: number | undefined = outputLines.findIndex(
        (line) => !line.startsWith('.'),
      );
      if (lastHeaderLine === -1) {
        lastHeaderLine = undefined;
      }
      let firstIncludeGuardWarningLine: number | undefined =
        outputLines.findLastIndex(
          (line) =>
            line.trim() === 'Multiple include guards may be useful for:',
        );
      if (firstIncludeGuardWarningLine === -1) {
        firstIncludeGuardWarningLine = undefined;
      }
      const compilerMessage =
        outputLines
          .slice(lastHeaderLine, firstIncludeGuardWarningLine)
          .join('\n') + '\n';
      return new CompileAndRunResponse({
        compilerOutput: compilerMessage + preCompilationIsolateOutput,
        compilationTime: precompilationMetadata.time
          ? +precompilationMetadata.time
          : undefined,
        compilationMemory: precompilationMetadata['max-rss']
          ? +precompilationMetadata['max-rss'] * 1024
          : undefined,
        code: returnCode,
      });
    }
    if (compileAndRunDto.allowedHeaders !== null) {
      const headerMatches = precompilationOutput.matchAll(/^\. .*\/(.*)$/gm);
      for (const headerMatch of headerMatches) {
        const header = headerMatch[1];
        if (!compileAndRunDto.allowedHeaders.includes(header)) {
          return new CompileAndRunResponse({
            compilerOutput: `Prepreprocessor: Fatal error: Header ${header} is not allowed\nCompilation terminated.\nExited with error status 1\n`,
            compilationTime: precompilationMetadata.time
              ? +precompilationMetadata.time
              : undefined,
            compilationMemory: precompilationMetadata['max-rss']
              ? +precompilationMetadata['max-rss'] * 1024
              : undefined,
            code: ResultCode.HNA,
          });
        }
      }
    }
    code = this.addBannendFunctionAsserts(
      code,
      compileAndRunDto.bannedFunctions,
      includeCount,
    );
    const executableFilePath = join(
      this.configService.getOrThrow<string>('storages.temporary.path'),
      'executables',
      `out-${requestId}.o`,
    );
    try {
      const {
        exitCode: compilationExitCode,
        isolateOutput: compilationIsolateOutput,
        output: compilationOutput,
        metadata: compilationMetadata,
      } = await this.executor.execute(
        [
          `/usr/bin/${compiler}`,
          '-pass-exit-codes',
          `-fdiagnostics-color=${compileAndRunDto.formattedDiagnostic ? 'always' : 'never'}`,
          `-fdiagnostics-urls=${compileAndRunDto.formattedDiagnostic ? 'always' : 'never'}`,
          `--std=${compileAndRunDto.language}`,
          `${warningString}`,
          `-${compileAndRunDto.optimizationLevel}`,
          '-march=znver3',
          '-mtune=znver3',
          `${codeFilename}`,
          '-o',
          'out.o',
        ],
        -requestId,
        {
          inputTexts: [{ name: codeFilename, text: code }],
          outputFiles: [{ name: 'out.o', path: executableFilePath }],
          processLimit: null,
          environment: {
            PATH: '/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin',
          },
          memoryLimit: compileAndRunDto.compilationMemoryLimit,
          timeLimit: compileAndRunDto.compilationTimeLimit,
          wallTimeLimit: compilationWallTimeLimit,
          fileSizeLimit: ConfigConstants.compiler.maxExecutableSize,
        },
      );
      if (compilationExitCode !== 0) {
        const bannedFunctionMatches = compilationOutput.matchAll(
          /error: static assertion failed: "Function (.*?) is not allowed\."/gm,
        );
        const bannedFunctions = Array.from(
          bannedFunctionMatches,
          (match) => match[1],
        );
        if (bannedFunctions.length > 0) {
          return new CompileAndRunResponse({
            compilerOutput: `Prepreprocessor: Fatal error: Function ${bannedFunctions[0]} is not allowed\nCompilation terminated.\nExited with error status 1\n`,
            compilationTime: compilationMetadata.time
              ? +compilationMetadata.time
              : undefined,
            compilationMemory: compilationMetadata['max-rss']
              ? +compilationMetadata['max-rss'] * 1024
              : undefined,
            code: ResultCode.FNA,
          });
        }
        const exitSignal = precompilationMetadata.exitsig
          ? +precompilationMetadata.exitsig
          : 0;
        let returnCode = ResultCode.CE;
        if (
          precompilationOutput.includes('memory exhausted') ||
          precompilationOutput.includes(
            'Segmentation fault signal terminated program',
          ) ||
          exitSignal === 11 ||
          exitSignal === 127
        ) {
          returnCode = ResultCode.CMLE;
        }
        if (precompilationOutput.includes('File size limit exceeded')) {
          returnCode = ResultCode.COLE;
        }
        if (precompilationMetadata.status === 'TO') {
          returnCode = ResultCode.CTLE;
        }
        return new CompileAndRunResponse({
          compilerOutput:
            compilationOutput +
            (compilationOutput.endsWith('\n') ? '' : '\n') +
            compilationIsolateOutput,
          compilationTime: compilationMetadata.time
            ? +compilationMetadata.time
            : undefined,
          compilationMemory: compilationMetadata['max-rss']
            ? +compilationMetadata['max-rss'] * 1024
            : undefined,
          code: returnCode,
        });
      }
      const executableSize = (await fs.promises.stat(executableFilePath)).size;
      const rawOutputs = await Promise.all(
        compileAndRunDto.inputs.map(
          async (input) =>
            await this.executor.execute('out.o', -requestId, {
              stdin: input,
              inputFiles: [{ name: 'out.o', path: executableFilePath }],
              memoryLimit: compileAndRunDto.memoryLimit,
              timeLimit: compileAndRunDto.timeLimit,
              wallTimeLimit: wallTimeLimit,
              fileSizeLimit: ConfigConstants.executor.maxOutputSize,
            }),
        ),
      );
      const outputs = rawOutputs.map((rawOutput) =>
        this.processOutput(
          rawOutput,
          compileAndRunDto.timeLimit,
          compileAndRunDto.memoryLimit,
        ),
      );
      const totalExecutionTime = outputs.reduce(
        (acc, output) => (acc += output.executionTime || 0),
        0,
      );
      const maxExecutionMemory = outputs.reduce(
        (acc, output) => (acc = Math.max(acc, output.executionMemory || 0)),
        0,
      );
      return new CompileAndRunResponse({
        compilerOutput:
          compilationOutput + (compilationOutput.endsWith('\n') ? '' : '\n'),
        compilationTime: compilationMetadata.time
          ? +compilationMetadata.time
          : undefined,
        compilationMemory: compilationMetadata['max-rss']
          ? +compilationMetadata['max-rss'] * 1024
          : undefined,
        executableSize: executableSize,
        totalExecutionTime: totalExecutionTime,
        maxExecutionMemory: maxExecutionMemory,
        outputs,
      });
    } finally {
      try {
        await fs.promises.unlink(executableFilePath);
      } catch (e) {
        this.logger.warn(
          `Failed to delete executable file at ${executableFilePath}: ${e}`,
        );
      }
    }
  }

  private hoistIncludes(code: string): { code: string; includeCount: number } {
    const includeLines: string[] = [];
    const codeLines: string[] = [];
    for (const line of code.split('\n')) {
      if (line.trim().startsWith('#include')) {
        includeLines.push(line);
        continue;
      }
      if (line.trim() === '') {
        continue;
      }
      codeLines.push(line);
    }
    return {
      code: includeLines.join('\n') + '\n\n' + codeLines.join('\n') + '\n',
      includeCount: includeLines.length,
    };
  }

  private addBannendFunctionAsserts(
    code: string,
    bannedFunctions: string[],
    insertAt: number,
  ): string {
    const bannedFunctionLines: string[] = [];
    for (const bannedFunction of bannedFunctions) {
      bannedFunctionLines.push(
        `#define ${bannedFunction}(...) _Static_assert(0, "Function ${bannedFunction} is not allowed.")`,
      );
    }
    const codeLines = code.split('\n');
    return (
      codeLines.slice(0, insertAt).join('\n') +
      '\n\n' +
      bannedFunctionLines.join('\n') +
      '\n' +
      codeLines.slice(insertAt).join('\n') +
      '\n'
    );
  }

  private processOutput(
    output: ExecutionResult,
    timeLimit: number,
    memoryLimit: number,
  ): CompileAndRunOutput {
    const exitSignal = output.metadata.exitsig ? +output.metadata.exitsig : 0;
    let returnCode: ResultCode | undefined;
    if (output.exitCode !== 0) {
      returnCode = ResultCode.RE;
      if (
        (exitSignal === 11 || exitSignal === 127) &&
        output.metadata['max-rss'] &&
        +output.metadata['max-rss'] * 1024 >
          Math.min(memoryLimit * 0.9, memoryLimit - 2 * 1024 * 1024)
      ) {
        returnCode = ResultCode.MLE;
      }
      if (exitSignal === 25) {
        returnCode = ResultCode.OLE;
      }
      if (output.metadata.status === 'TO') {
        returnCode = ResultCode.TLE;
      }
      if (output.metadata.status === 'RE') {
        returnCode = ResultCode.IR;
      }
      if (output.metadata.status === 'XX') {
        returnCode = ResultCode.IE;
      }
    }
    if (
      output.metadata['max-rss'] &&
      +output.metadata['max-rss'] > memoryLimit
    ) {
      returnCode = ResultCode.MLE;
    }
    if (output.metadata.time && +output.metadata.time > timeLimit) {
      returnCode = ResultCode.TLE;
    }
    return {
      runtimeOutput: returnCode
        ? output.output +
          (output.output && output.output.endsWith('\n') ? '' : '\n') +
          output.isolateOutput
        : output.output,
      executionTime: output.metadata.time ? +output.metadata.time : undefined,
      executionMemory: output.metadata['max-rss']
        ? +output.metadata['max-rss'] * 1024
        : undefined,
      code: returnCode,
    };
  }
}
