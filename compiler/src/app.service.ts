import { join } from 'path';
import * as fs from 'fs';

import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';

import {
  CompileAndRunDto,
  CompileAndRunResponse,
} from './dto/compile-and-run.dto';
import { ConfigConstants } from './config/config-constants';
import { WarningLevel } from './enums/warning-level.enum';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async compileAndRun(
    compileAndRunDto: CompileAndRunDto,
  ): CompileAndRunResponse {
    const inputCount = compileAndRunDto.inputs.length;
    const isCpp = compileAndRunDto.language.includes('++');
    const compiler = isCpp ? 'g++' : 'gcc';
    const warningString =
      compileAndRunDto.warningLevel === WarningLevel.Default
        ? ''
        : `-W${compileAndRunDto.warningLevel}`;
    const boxCount = Math.min(1 + inputCount, 64);
    const boxes = Array.from({ length: boxCount }, (_, i) => i);
    // Fix exec not async
    await Promise.all(
      boxes.map(async (box) => exec(`isolate --init -b ${box}`)),
    );
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
    // Fix exec not async
    // Fix unlimited process count allowed
    // Fix full env passed
    await exec(
      `isolate --run -p -e -b 0 -- /usr/bin/${compiler} ${warningString} --std${compileAndRunDto.language} -${compileAndRunDto.optimizationLevel} code.cpp -o out.o`,
    );
  }
}
