import * as fs from 'fs';
import { join } from 'path';

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigConstants } from './config/config-constants';
import {
  CompileAndRunDto,
  CompileAndRunResponse,
} from './dto/compile-and-run.dto';
import { ResultCode } from './enums/result-code.enum';
import { WarningLevel } from './enums/warning-level.enum';
import { execAsync } from './execAsync';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async compileAndRun(
    compileAndRunDto: CompileAndRunDto,
  ): CompileAndRunResponse {
    let out: string = '',
      err: string = '';
    const inputCount = compileAndRunDto.inputs.length;
    const isCpp = compileAndRunDto.language.includes('++');
    const compiler = isCpp ? 'g++' : 'gcc';
    const warningString =
      compileAndRunDto.warningLevel === WarningLevel.Default
        ? ''
        : `-W${compileAndRunDto.warningLevel}`;
    const boxCount = Math.min(
      1 + inputCount,
      ConfigConstants.isolate.max_box_count,
    );
    const boxes = Array.from({ length: boxCount }, (_, i) => i);
    try {
      await Promise.all(
        boxes.map(
          async (box) =>
            await execAsync(`isolate --init -b ${box}`, {
              timeout: 1000,
            }),
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
    await fs.promises.writeFile(
      join(
        ConfigConstants.isolate.box_root,
        '0',
        'box',
        isCpp ? 'code.cpp' : 'code.c',
      ),
      compileAndRunDto.code,
      { encoding: 'utf-8' },
    );
    // TODO: Add error parsing
    try {
      const { stderr } = await execAsync(
        `isolate --run -b 0 -p -e --stderr-to-stdout -o ${join(this.configService.getOrThrow<string>('storages.temporary.path'), 'out.txt')} -- /usr/bin/${compiler} --std=${compileAndRunDto.language} code.cpp -H`,
        {
          env: {
            PATH: '/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin',
          },
        },
      );
      err = stderr;
    } catch (e) {
      const output = await fs.promises.readFile(
        join(
          this.configService.getOrThrow<string>('storages.temporary.path'),
          'out.txt',
        ),
        { encoding: 'utf-8' },
      );
      return new CompileAndRunResponse({
        compilerOutput: output + err,
        code: ResultCode.UE,
      });
    }
    const unparsedHeaders = await fs.promises.readFile(
      join(
        this.configService.getOrThrow<string>('storages.temporary.path'),
        'out.txt',
      ),
      { encoding: 'utf-8' },
    );
    const headers = unparsedHeaders.match(/^\. .*\/(.*)$/gm);
    if (headers) {
      for (const header of headers) {
        if (!compileAndRunDto.allowedHeaders.includes(header)) {
          return new CompileAndRunResponse({
            compilerOutput: `prepreprocessor: fatal error: ${header} is not allowed\ncompilation terminated.\nExited with error status 1`,
            code: ResultCode.HNA,
          });
        }
      }
    }
    const processedCode = this.processCode(
      compileAndRunDto.code,
      compileAndRunDto.bannedFunctions,
    );
    await fs.promises.writeFile(
      join(
        ConfigConstants.isolate.box_root,
        '0',
        'box',
        isCpp ? 'code.cpp' : 'code.c',
      ),
      processedCode,
      { encoding: 'utf-8' },
    );
    // TODO: Add error parsing
    try {
      await execAsync(
        `isolate --run -b 0 -p -e -- /usr/bin/${compiler} --std=${compileAndRunDto.language} ${warningString} -${compileAndRunDto.optimizationLevel} code.cpp -o out.o`,
        {
          env: {
            PATH: '/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin',
          },
        },
      );
    } catch (e) {
      console.error('Error when trying to compile inside isolate');
      console.error(e);
      throw new InternalServerErrorException({
        message: 'Failed to compile code',
        errors: { internal: 'Failed to compile code' },
      });
    }
  }

  private processCode(code: string, bannedFunctions: string[]): string {
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
    const bannedFunctionsLine: string[] = [];
    for (const bannedFunction of bannedFunctions) {
      bannedFunctionsLine.push(
        `#define ${bannedFunction}(...) _Static_assert(0, "Function ${bannedFunction} is not allowed.")`,
      );
    }
    return (
      includeLines.join('\n') +
      '\n' +
      bannedFunctionsLine.join('\n') +
      '\n' +
      codeLines.join('\n')
    );
  }
}
