import * as fs from 'fs/promises';
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

function trim(str: string, ch: string): string {
  let start = 0;
  while (start < str.length && str[start] === ch) {
    start++;
  }
  let end = str.length - 1;
  while (end >= 0 && str[end] === ch) {
    end--;
  }
  return str.slice(start, end + 1);
}

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
      this.configService.getOrThrow<number>('executor.wallTimeLimitMultiplier'),
      this.configService.getOrThrow<number>('executor.wallTimeLimitOffset'),
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
      await fs.mkdir(
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
      compileAndRunDto.compilationTimeLimit *
        this.configService.getOrThrow<number>(
          'executor.wallTimeLimitMultiplier',
        ),
      compileAndRunDto.compilationTimeLimit +
        this.configService.getOrThrow<number>('executor.wallTimeLimitOffset'),
    );
    const wallTimeLimit = Math.max(
      compileAndRunDto.timeLimit *
        this.configService.getOrThrow<number>(
          'executor.wallTimeLimitMultiplier',
        ),
      compileAndRunDto.timeLimit +
        this.configService.getOrThrow<number>('executor.wallTimeLimitOffset'),
    );
    const hoistResult = this.hoistIncludes(compileAndRunDto.code);
    let code = hoistResult.code;
    const includeCount = hoistResult.includeCount;
    code = this.addBannendFunctionAsserts(
      code,
      compileAndRunDto.bannedFunctions,
      includeCount,
      isCpp,
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
        output: compilationOutputWithHeaders,
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
          `-march=${this.configService.getOrThrow<string>('compiler.march')}`,
          `-mtune=${this.configService.getOrThrow<string>('compiler.mtune')}`,
          `${codeFilename}`,
          '-H',
          '-o',
          'out.o',
          '-lm',
        ],
        -requestId,
        {
          inputTexts: [{ name: codeFilename, text: code }],
          outputFiles: [{ name: 'out.o', path: executableFilePath }],
          processLimit: null,
          inheritEnvironment: true,
          memoryLimit: compileAndRunDto.compilationMemoryLimit,
          timeLimit: compileAndRunDto.compilationTimeLimit,
          wallTimeLimit: compilationWallTimeLimit,
          fileSizeLimit: ConfigConstants.compiler.maxExecutableSize,
        },
      );
      if (compileAndRunDto.allowedHeaders !== null) {
        const headerMatches =
          compilationOutputWithHeaders.matchAll(/^\. .*\/(.*)$/gm);
        for (const headerMatch of headerMatches) {
          const header = headerMatch[1];
          if (!compileAndRunDto.allowedHeaders.includes(header)) {
            return new CompileAndRunResponse({
              compilerOutput: `Prepreprocessor: Fatal error: Header ${header} is not allowed\nCompilation terminated.\nExited with error status 1\n`,
              compilationTime: compilationMetadata.time
                ? +compilationMetadata.time
                : undefined,
              compilationMemory: compilationMetadata['max-rss']
                ? +compilationMetadata['max-rss'] * 1024
                : undefined,
              code: ResultCode.HNA,
            });
          }
        }
      }
      const outputLines = compilationOutputWithHeaders.split('\n');
      let firstHeaderLine: number | undefined = outputLines.findIndex((line) =>
        line.startsWith('.'),
      );
      if (firstHeaderLine === -1) {
        firstHeaderLine = undefined;
      }
      let lastHeaderLine: number | undefined = outputLines.findIndex(
        (line, i) =>
          !line.startsWith('.') && i >= (firstHeaderLine ?? Infinity),
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
      let lastIncludeGuardWarningLine: number | undefined =
        outputLines.findIndex(
          (line, i) =>
            (!line.startsWith('/') || line.endsWith(':')) &&
            i > (firstIncludeGuardWarningLine ?? Infinity),
        );
      if (lastIncludeGuardWarningLine === -1) {
        lastIncludeGuardWarningLine = undefined;
      }
      let compilationOutput =
        outputLines.slice(0, firstHeaderLine).join('\n') + '\n';
      if (
        lastHeaderLine !== undefined ||
        firstIncludeGuardWarningLine !== undefined
      ) {
        compilationOutput +=
          outputLines
            .slice(lastHeaderLine, firstIncludeGuardWarningLine)
            .join('\n') + '\n';
      }
      if (lastIncludeGuardWarningLine !== undefined) {
        compilationOutput +=
          outputLines.slice(lastIncludeGuardWarningLine).join('\n') + '\n';
      }
      if (!compilationOutput.trim()) {
        compilationOutput = '';
      } else {
        compilationOutput = trim(compilationOutput, '\n') + '\n';
      }
      if (compilationExitCode !== 0) {
        const bannedFunctionMatches = compilationOutput.matchAll(
          /static assertion failed: "?Function (.*?) is not allowed\."?/gm,
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
        const exitSignal = compilationMetadata.exitsig
          ? +compilationMetadata.exitsig
          : 0;
        let resultCode = ResultCode.CE;
        if (
          compilationOutput.includes('memory exhausted') ||
          compilationOutput.includes('out of memory') ||
          compilationOutput.includes(
            'Segmentation fault signal terminated program',
          ) ||
          exitSignal === 11 ||
          exitSignal === 127
        ) {
          resultCode = ResultCode.CMLE;
        }
        if (compilationOutput.includes('File size limit exceeded')) {
          resultCode = ResultCode.COLE;
        }
        if (compilationMetadata.status === 'TO') {
          resultCode = ResultCode.CTLE;
        }
        return new CompileAndRunResponse({
          compilerOutput:
            compilationOutput +
            (compilationOutput && !compilationOutput.endsWith('\n')
              ? '\n'
              : '') +
            compilationIsolateOutput,
          compilationTime: compilationMetadata.time
            ? +compilationMetadata.time
            : undefined,
          compilationMemory: compilationMetadata['max-rss']
            ? +compilationMetadata['max-rss'] * 1024
            : undefined,
          code: resultCode,
        });
      }
      const executableSize = (await fs.stat(executableFilePath)).size;
      const rawOutputs = await Promise.all(
        compileAndRunDto.inputs.map((input) =>
          this.executor.execute('out.o', -requestId, {
            stdin: input,
            inputFiles: [{ name: 'out.o', path: executableFilePath }],
            memoryLimit: compileAndRunDto.memoryLimit,
            timeLimit: compileAndRunDto.timeLimit,
            wallTimeLimit: wallTimeLimit,
            openFilesLimit: ConfigConstants.executor.maxOpenFiles,
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
          compilationOutput +
          (compilationOutput && !compilationOutput.endsWith('\n') ? '\n' : ''),
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
        await fs.unlink(executableFilePath);
      } catch (e) {
        this.logger.verbose(
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
    isCpp: boolean,
  ): string {
    if (bannedFunctions.length === 0) {
      return code;
    }
    const bannedFunctionLines: string[] = [];
    for (const bannedFunction of bannedFunctions) {
      if (isCpp) {
        bannedFunctionLines.push(
          `#define ${bannedFunction}(...) static_assert(0, "Function ${bannedFunction} is not allowed.")`,
        );
      } else {
        bannedFunctionLines.push(
          `#define ${bannedFunction}(...) _Static_assert(0, "Function ${bannedFunction} is not allowed.")`,
        );
      }
    }
    const codeLines = code.split('\n');
    return (
      codeLines.slice(0, insertAt).join('\n') +
      '\n\n' +
      bannedFunctionLines.join('\n') +
      '\n' +
      codeLines.slice(insertAt).join('\n')
    );
  }

  private processOutput(
    output: ExecutionResult,
    timeLimit: number,
    memoryLimit: number,
  ): CompileAndRunOutput {
    const exitSignal = output.metadata.exitsig
      ? +output.metadata.exitsig
      : undefined;
    let resultCode: ResultCode | undefined;
    if (output.exitCode !== 0) {
      resultCode = ResultCode.RE;
      if (
        (exitSignal === 11 || exitSignal === 127) &&
        output.metadata['max-rss'] &&
        +output.metadata['max-rss'] * 1024 >
          Math.min(memoryLimit * 0.9, memoryLimit - 2 * 1024 * 1024)
      ) {
        resultCode = ResultCode.MLE;
      }
      if (exitSignal === 25) {
        resultCode = ResultCode.OLE;
      }
      if (output.metadata.status === 'TO') {
        resultCode = ResultCode.TLE;
      }
      if (output.metadata.status === 'XX') {
        resultCode = ResultCode.IE;
      }
    }
    if (
      output.metadata['max-rss'] &&
      +output.metadata['max-rss'] > memoryLimit
    ) {
      resultCode = ResultCode.MLE;
    }
    if (output.metadata.time && +output.metadata.time > timeLimit) {
      resultCode = ResultCode.TLE;
    }
    return {
      runtimeOutput: resultCode
        ? output.output +
          (output.output && !output.output.endsWith('\n') ? '\n' : '') +
          output.isolateOutput
        : output.output,
      executionTime: output.metadata.time ? +output.metadata.time : undefined,
      executionMemory: output.metadata['max-rss']
        ? +output.metadata['max-rss'] * 1024
        : undefined,
      code: resultCode,
      exitSignal: exitSignal,
    };
  }
}
