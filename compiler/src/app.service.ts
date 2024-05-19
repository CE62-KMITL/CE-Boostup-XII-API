import * as fs from 'fs';
import { join } from 'path';

import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigConstants } from './config/config-constants';
import {
  CompileAndRunDto,
  CompileAndRunResponse,
} from './dto/compile-and-run.dto';
import { ResultCode } from './enums/result-code.enum';
import { WarningLevel } from './enums/warning-level.enum';
import { execAsync } from './execAsync';
import { loadKeyValue } from './load-key-value';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.createTemporaryDirectories();
  }

  private async createTemporaryDirectories(): Promise<void> {
    for (const path of [
      'executables',
      join('metadata', 'comliler'),
      join('metadata', 'executor'),
    ]) {
      await fs.promises.mkdir(
        join(
          this.configService.getOrThrow<string>('storages.temporary.path'),
          path,
        ),
        { recursive: true },
      );
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  async compileAndRun(
    compileAndRunDto: CompileAndRunDto,
  ): Promise<CompileAndRunResponse> {
    let isolateOutput: string = '';
    const inputCount = compileAndRunDto.inputs.length;
    const isCpp = compileAndRunDto.language.includes('++');
    const compiler = isCpp ? 'g++' : 'gcc';
    const warningString =
      compileAndRunDto.warningLevel === WarningLevel.Default
        ? ''
        : `-W${compileAndRunDto.warningLevel}`;
    const wallTimeLimit = Math.min(
      compileAndRunDto.timeLimit * 1.5,
      compileAndRunDto.timeLimit + 5,
    );
    const blockSize = (await fs.promises.stat('/')).blksize;
    const compilerDiskQuota = Math.round(
      (ConfigConstants.compiler.maxExecutableSize +
        ConfigConstants.compiler.maxCodeLength +
        8 * 1024 * 1024) /
        blockSize,
    );
    const executorDiskQuota = Math.round(
      (ConfigConstants.compiler.maxExecutableSize +
        ConfigConstants.executor.maxInputSize +
        ConfigConstants.executor.maxOutputSize +
        8 * 1024 * 1024) /
        blockSize,
    );
    const hoistResult = this.hoistIncludes(compileAndRunDto.code);
    let code = hoistResult.code;
    const includeCount = hoistResult.includeCount;
    const boxCount = Math.min(
      1 + inputCount,
      ConfigConstants.isolate.max_box_count,
    );
    try {
      await execAsync(`isolate --init -b 0 -q ${compilerDiskQuota},4`, {
        encoding: 'utf-8',
        timeout: 1000,
      });
    } catch (e) {
      console.error('Error when trying to initialize isolate');
      console.error(e);
      throw new InternalServerErrorException({
        message: 'Failed to initialize isolate',
        errors: { internal: 'Failed to initialize isolate' },
      });
    }
    await fs.promises.writeFile(
      join(
        ConfigConstants.isolate.box_root,
        '0',
        'box',
        isCpp ? 'code.cpp' : 'code.c',
      ),
      code,
      { encoding: 'utf-8' },
    );
    try {
      const { stderr } = await execAsync(
        `isolate --run -b 0 -p -e --stderr-to-stdout -o ${join(ConfigConstants.isolate.box_root, '0', 'box', 'gcc-precompilation-output.txt')} -m ${Math.round(compileAndRunDto.compilationMemoryLimit / 1024).toFixed(0)} -w ${compileAndRunDto.compilationTimeLimit.toFixed(3)} -n 4 -f ${Math.ceil(ConfigConstants.compiler.maxExecutableSize / 1024).toFixed(0)} -- /usr/bin/${compiler} -fdiagnostics-color=never --std=${compileAndRunDto.language} code.cpp -H`,
        {
          encoding: 'utf-8',
          env: {
            PATH: '/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin',
          },
          timeout: compileAndRunDto.compilationTimeLimit * 1000 + 1000,
        },
      );
      isolateOutput = stderr;
    } catch (e) {
      const preCompilationOutput = await fs.promises.readFile(
        join(
          ConfigConstants.isolate.box_root,
          '0',
          'box',
          'gcc-precompilation-output.txt',
        ),
        { encoding: 'utf-8' },
      );
      return new CompileAndRunResponse({
        compilerOutput: preCompilationOutput + isolateOutput,
        code: ResultCode.CE,
      });
    }
    const preCompilationOutput = await fs.promises.readFile(
      join(
        ConfigConstants.isolate.box_root,
        '0',
        'box',
        'gcc-precompilation-output.txt',
      ),
      { encoding: 'utf-8' },
    );
    const headerMatches = preCompilationOutput.matchAll(/^\. .*\/(.*)$/gm);
    if (headerMatches) {
      for (const headerMatch of headerMatches) {
        const header = headerMatch[1];
        if (!compileAndRunDto.allowedHeaders.includes(header)) {
          return new CompileAndRunResponse({
            compilerOutput: `Prepreprocessor: Fatal error: Header ${header} is not allowed\nCompilation terminated.\nExited with error status 1`,
            code: ResultCode.HNA,
          });
        }
      }
    }
    try {
      await execAsync('isolate --cleanup -b 0', {
        encoding: 'utf-8',
        timeout: 1000,
      });
    } catch (e) {
      console.error('Error when trying to cleanup isolate');
      console.error(e);
    }
    try {
      await execAsync(`isolate --init -b 0 -q ${compilerDiskQuota},4`, {
        encoding: 'utf-8',
        timeout: 1000,
      });
    } catch (e) {
      console.error('Error when trying to initialize isolate');
      console.error(e);
      throw new InternalServerErrorException({
        message: 'Failed to initialize isolate',
        errors: { internal: 'Failed to initialize isolate' },
      });
    }
    code = this.addBannendFunctionAsserts(
      code,
      compileAndRunDto.bannedFunctions,
      includeCount,
    );
    await fs.promises.writeFile(
      join(
        ConfigConstants.isolate.box_root,
        '0',
        'box',
        isCpp ? 'code.cpp' : 'code.c',
      ),
      code,
      { encoding: 'utf-8' },
    );
    try {
      const { stderr } = await execAsync(
        `isolate --run -b 0 -p -e --stderr-to-stdout -o ${join(ConfigConstants.isolate.box_root, '0', 'box', 'gcc-ompilation-output.txt')} -M ${join(this.configService.getOrThrow<string>('storages.temporary.path'), 'metadata', 'compiler', `compilation.txt`)} -m ${Math.round(compileAndRunDto.compilationMemoryLimit / 1024).toFixed(0)} -w ${compileAndRunDto.compilationTimeLimit.toFixed(3)} -n 4 -f ${Math.ceil(ConfigConstants.compiler.maxExecutableSize / 1024).toFixed(0)} -- /usr/bin/${compiler} -fdiagnostics-color=never --std=${compileAndRunDto.language} ${warningString} -${compileAndRunDto.optimizationLevel} code.cpp -o out.o`,
        {
          encoding: 'utf-8',
          env: {
            PATH: '/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin',
          },
          timeout: compileAndRunDto.compilationTimeLimit * 1000 + 1000,
        },
      );
      isolateOutput = stderr;
    } catch (e) {
      const compilationOutput = await fs.promises.readFile(
        join(
          ConfigConstants.isolate.box_root,
          '0',
          'box',
          'gcc-compilation-output.txt',
        ),
        { encoding: 'utf-8' },
      );
      const bannedFunctionMatches = compilationOutput.matchAll(
        /error: static assertion failed: "Function (.*?) is not allowed\."/gm,
      );
      if (bannedFunctionMatches) {
        const bannedFunctions = Array.from(
          bannedFunctionMatches,
          (match) => match[1],
        );
        return new CompileAndRunResponse({
          compilerOutput: `Prepreprocessor: Fatal error: Function ${bannedFunctions[0]} is not allowed\nCompilation terminated.\nExited with error status 1`,
          code: ResultCode.FNA,
        });
      }
      return new CompileAndRunResponse({
        compilerOutput: compilationOutput + isolateOutput,
        code: ResultCode.CE,
      });
    }
    const compilationOutput = await fs.promises.readFile(
      join(
        ConfigConstants.isolate.box_root,
        '0',
        'box',
        'gcc-compilation-output.txt',
      ),
      { encoding: 'utf-8' },
    );
    const compilationMetadata = loadKeyValue(
      await fs.promises.readFile(
        join(
          this.configService.getOrThrow<string>('storages.temporary.path'),
          'metadata',
          'compiler',
          `compilation.txt`,
        ),
        { encoding: 'utf-8' },
      ),
    );
    const compiledFilePath = join(
      this.configService.getOrThrow<string>('storages.temporary.path'),
      'executables',
      'out.o',
    );
    await fs.promises.copyFile(
      join(ConfigConstants.isolate.box_root, '0', 'box', 'out.o'),
      compiledFilePath,
    );
    try {
      await execAsync('isolate --cleanup -b 0', {
        encoding: 'utf-8',
        timeout: 1000,
      });
    } catch (e) {
      console.error('Error when trying to cleanup isolate');
      console.error(e);
    }
    const outputs: CompileAndRunResponse['outputs'] = [];
    while (compileAndRunDto.inputs.length > 0) {
      const batchSize = Math.min(boxCount, compileAndRunDto.inputs.length);
      const boxes = Array.from({ length: batchSize }, (_, i) => i);
      try {
        await Promise.all(
          boxes.map(
            async (box) =>
              await execAsync(
                `isolate --init -b ${box} -q ${executorDiskQuota},4`,
                {
                  encoding: 'utf-8',
                  timeout: 1000,
                },
              ),
          ),
        );
      } catch (e) {
        console.error('Error when trying to initialize isolate');
        console.error(e);
        throw new InternalServerErrorException({
          message: 'Failed to initialize isolate',
          errors: { internal: 'Failed to initialize isolate' },
        });
      }
      await Promise.all(
        boxes.map(
          async (box) =>
            await fs.promises.copyFile(
              compiledFilePath,
              join(
                ConfigConstants.isolate.box_root,
                box.toString(),
                'box',
                'out.o',
              ),
            ),
        ),
      );
      await Promise.all(
        boxes.map(
          async (box) =>
            await fs.promises.writeFile(
              join(
                ConfigConstants.isolate.box_root,
                box.toString(),
                'box',
                'stdin.txt',
              ),
              compileAndRunDto.inputs[box],
              { encoding: 'utf-8' },
            ),
        ),
      );
      compileAndRunDto.inputs.splice(0, batchSize);
      await Promise.all(
        boxes.map(async (box) => {
          let isolateOutput: string = '';
          try {
            const { stderr } = await execAsync(
              `isolate --run -b ${box} --stderr-to-stdout -o ${join(ConfigConstants.isolate.box_root, box.toString(), 'box', 'output.txt')} -M ${join(this.configService.getOrThrow<string>('storages.temporary.path'), 'metadata', 'executor', `box-${box}.txt`)} -i ${join(ConfigConstants.isolate.box_root, box.toString(), 'box', 'stdin.txt')} -m ${Math.round(compileAndRunDto.memoryLimit / 1024).toFixed(0)} -t ${compileAndRunDto.timeLimit.toFixed(3)} -w ${wallTimeLimit.toFixed(0)} -n 4 -f 1 -- out.o`,
              {
                encoding: 'utf-8',
                timeout: wallTimeLimit * 1000 + 1000,
              },
            );
            isolateOutput = stderr;
          } catch (e) {
            const output = await fs.promises.readFile(
              join(
                ConfigConstants.isolate.box_root,
                box.toString(),
                'box',
                'output.txt',
              ),
              { encoding: 'utf-8' },
            );
            const metadataText = await fs.promises.readFile(
              join(
                this.configService.getOrThrow<string>(
                  'storages.temporary.path',
                ),
                'metadata',
                'executor',
                `box-${box}.txt`,
              ),
              { encoding: 'utf-8' },
            );
            const metadata = loadKeyValue(metadataText);
            let code = ResultCode.RTE;
            if (isolateOutput.includes('Time limit exceeded')) {
              code = ResultCode.TLE;
            }
            outputs[box] = {
              runtimeOutput: output + isolateOutput,
              executionTime: metadata.time ? +metadata.time : undefined,
              executionMemory: metadata['max-rss']
                ? +metadata['max-rss'] * 1024
                : undefined,
              code: code,
            };
          }
          const output = await fs.promises.readFile(
            join(
              ConfigConstants.isolate.box_root,
              box.toString(),
              'box',
              'output.txt',
            ),
            { encoding: 'utf-8' },
          );
          const metadataText = await fs.promises.readFile(
            join(
              this.configService.getOrThrow<string>('storages.temporary.path'),
              'metadata',
              'executor',
              `box-${box}.txt`,
            ),
            { encoding: 'utf-8' },
          );
          const metadata = loadKeyValue(metadataText);
          if (metadata.time && +metadata.time > compileAndRunDto.timeLimit) {
            outputs[box] = {
              runtimeOutput: output + isolateOutput,
              executionTime: metadata.time ? +metadata.time : undefined,
              executionMemory: metadata['max-rss']
                ? +metadata['max-rss'] * 1024
                : undefined,
              code: ResultCode.TLE,
            };
          }
          outputs[box] = {
            runtimeOutput: output,
            executionTime: metadata.time ? +metadata.time : undefined,
            executionMemory: metadata['max-rss']
              ? +metadata['max-rss'] * 1024
              : undefined,
          };
        }),
      );
    }
    const boxes = Array.from({ length: boxCount }, (_, i) => i);
    try {
      await Promise.all(
        boxes.map(
          async (box) =>
            await execAsync(`isolate --cleanup -b ${box}`, {
              encoding: 'utf-8',
              timeout: 1000,
            }),
        ),
      );
    } catch (e) {
      console.error('Error when trying to cleanup isolate');
      console.error(e);
    }
    const totalRuntime = outputs.reduce(
      (acc, output) => (acc += output.executionTime || 0),
      0,
    );
    return new CompileAndRunResponse({
      totalRuntime: totalRuntime,
      compilerOutput: compilationOutput,
      compilationTime: compilationMetadata.time
        ? +compilationMetadata.time
        : undefined,
      outputs,
    });
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
      code: includeLines.join('\n') + '\n\n' + codeLines.join('\n'),
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
      codeLines.slice(insertAt).join('\n')
    );
  }
}
