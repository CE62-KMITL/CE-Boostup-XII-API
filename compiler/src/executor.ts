import * as fs from 'fs';
import { join } from 'path';

import { InternalServerErrorException, Logger } from '@nestjs/common';
import { Semaphore } from 'async-mutex';

import { ConfigConstants } from './config/config-constants';
import { loadKeyValue } from './load-key-value';
import { Shell } from './shell';

export class Executor {
  constructor(
    boxesRoot: string,
    boxCount: number,
    metadataStoragePath: string,
  ) {
    this.boxesRoot = boxesRoot;
    this.metadataStoragePath = metadataStoragePath;
    this.boxCount = boxCount;
    this.availableBoxes = Array.from({ length: boxCount }, (_, i) => i);
    this.shells = Array.from(
      { length: boxCount },
      (_, i) =>
        new Shell(i, '/bin/sh', {
          PATH: '/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin',
        }),
    );
    this.semaphore = new Semaphore(boxCount);
  }

  private readonly boxesRoot: string;
  private readonly boxCount: number;
  private readonly metadataStoragePath: string;
  private readonly availableBoxes: number[];
  private readonly shells: Shell[];

  private readonly logger = new Logger(Executor.name);
  private readonly semaphore: Semaphore;

  async getBoxStatuses(): Promise<{ total: number; available: number[] }> {
    return { total: this.boxCount, available: this.availableBoxes };
  }

  async execute(
    command: string | string[],
    priority: number = 0,
    options: ExecutionOptions = {},
  ): Promise<ExecutionResult> {
    const [, release] = await this.semaphore.acquire(1, priority);
    const box = this.availableBoxes.pop();
    if (box === undefined) {
      release();
      throw new InternalServerErrorException({
        message: 'Failed to acquire isolate box',
        errors: { internal: 'Failed to acquire isolate box' },
      });
    }
    const metadataFilePath = join(this.metadataStoragePath, `${box}.txt`);
    const shell = this.shells[box];
    try {
      try {
        await shell.exec(
          `isolate --init -b ${box}`,
          ConfigConstants.isolate.baseCommandTimeout,
        );
      } catch (e) {
        this.logger.error(`Failed to initialize isolate box ${box}: ${e}`);
        this.logger.error(`Command executed: \`isolate --init -b ${box}\``);
        throw new InternalServerErrorException({
          message: 'Failed to initialize isolate',
          errors: { internal: 'Failed to initialize isolate' },
        });
      }
      if (options.inputFiles) {
        try {
          await Promise.all(
            options.inputFiles.map(
              async (inputFile) =>
                await fs.promises.copyFile(
                  inputFile.path,
                  join(this.boxesRoot, box.toString(), 'box', inputFile.name),
                ),
            ),
          );
        } catch (e) {
          this.logger.error(
            `Failed to copy input files to isolate box ${box}: ${e}`,
          );
          throw new InternalServerErrorException({
            message: 'Failed to initialize environment',
            errors: { internal: 'Failed to initialize environment' },
          });
        }
      }
      if (options.inputTexts) {
        try {
          await Promise.all(
            options.inputTexts.map(
              async (inputText) =>
                await fs.promises.writeFile(
                  join(this.boxesRoot, box.toString(), 'box', inputText.name),
                  inputText.text,
                  { encoding: 'utf-8' },
                ),
            ),
          );
        } catch (e) {
          this.logger.error(
            `Failed to write input text to isolate box ${box}: ${e}`,
          );
          throw new InternalServerErrorException({
            message: 'Failed to initialize environment',
            errors: { internal: 'Failed to initialize environment' },
          });
        }
      }
      if (command instanceof Array) {
        command = command.join(' ');
      }
      const fullCommandList = [];
      fullCommandList.push('isolate');
      fullCommandList.push('--run');
      fullCommandList.push('-b');
      fullCommandList.push(box.toString());
      if (options.processLimit) {
        fullCommandList.push('-p');
        fullCommandList.push(options.processLimit.toFixed(0));
      }
      if (options.processLimit === null) {
        fullCommandList.push('-p');
      }
      if (options.inheritEnvironment) {
        fullCommandList.push('-e');
      }
      fullCommandList.push('--stderr-to-stdout');
      fullCommandList.push('-o');
      fullCommandList.push('output.txt');
      fullCommandList.push('-M');
      fullCommandList.push(metadataFilePath);
      if (options.stdin) {
        try {
          await fs.promises.writeFile(
            join(this.boxesRoot, box.toString(), 'box', 'stdin.txt'),
            options.stdin,
            { encoding: 'utf-8' },
          );
        } catch (e) {
          this.logger.error(
            `Failed to write stdin file in isolate box ${box}: ${e}`,
          );
          throw new InternalServerErrorException({
            message: 'Failed to initialize environment',
            errors: { internal: 'Failed to initialize environment' },
          });
        }
        fullCommandList.push('-i');
        fullCommandList.push('stdin.txt');
      }
      if (options.memoryLimit) {
        fullCommandList.push('-m');
        fullCommandList.push(Math.round(options.memoryLimit / 1024).toFixed(0));
      }
      if (options.timeLimit) {
        fullCommandList.push('-t');
        fullCommandList.push(options.timeLimit.toFixed(3));
      }
      if (options.wallTimeLimit) {
        fullCommandList.push('-w');
        fullCommandList.push(options.wallTimeLimit.toFixed(3));
      }
      if (options.openFilesLimit) {
        fullCommandList.push('-n');
        fullCommandList.push(options.openFilesLimit.toFixed(0));
      }
      if (options.fileSizeLimit) {
        fullCommandList.push('-f');
        fullCommandList.push(
          Math.ceil(options.fileSizeLimit / 1024).toFixed(0),
        );
      }
      fullCommandList.push('--');
      fullCommandList.push(command);
      const fullCommand = fullCommandList.join(' ');
      let commandTimeout = ConfigConstants.isolate.baseCommandTimeout;
      if (options.timeLimit) {
        commandTimeout =
          ConfigConstants.isolate.baseCommandTimeout +
          Math.max(options.timeLimit * 4, options.timeLimit + 30) * 1000;
      }
      if (options.wallTimeLimit) {
        commandTimeout =
          ConfigConstants.isolate.baseCommandTimeout +
          options.wallTimeLimit * 1000;
      }
      let exitCode: number | string = '0';
      try {
        await shell.exec(fullCommand, commandTimeout);
      } catch (e) {
        exitCode = '1';
        this.logger.verbose(
          `Failed to execute user provided command: ${fullCommand}: ${e}`,
        );
        if (e.killed) {
          this.logger.error(
            `Execution secondary timeout activated for isolate box ${box} with command: ${fullCommand}`,
          );
          throw new InternalServerErrorException({
            message: 'Execution timeout',
            errors: {
              internal: 'Execution timeout, this may be due to heavy load',
            },
          });
        }
        if (e.stderr.includes('This box is currently in use')) {
          this.logger.error(
            `Isolate box ${box} is currently in use, this should not happen`,
          );
          throw new InternalServerErrorException({
            message: 'Isolate box in use',
            errors: { internal: 'Isolate box in use, this is abnormal' },
          });
        }
      }
      const outputFilePath = join(
        this.boxesRoot,
        box.toString(),
        'box',
        'output.txt',
      );
      let output = '';
      try {
        output = await fs.promises.readFile(outputFilePath, {
          encoding: 'utf-8',
        });
      } catch (e) {
        this.logger.error(
          `Failed to read output file from isolate box ${box} at ${outputFilePath}: ${e}`,
        );
      }
      let metadata: Record<string, string> = {};
      try {
        metadata = loadKeyValue(
          await fs.promises.readFile(metadataFilePath, {
            encoding: 'utf-8',
          }),
        );
      } catch (e) {
        this.logger.error(
          `Failed to read metadata file from isolate box ${box} at ${metadataFilePath}: ${e}`,
        );
      }
      if (options.outputFiles) {
        await Promise.allSettled(
          options.outputFiles.map(async (outputFile) => {
            try {
              await fs.promises.copyFile(
                join(this.boxesRoot, box.toString(), 'box', outputFile.name),
                outputFile.path,
              );
            } catch (e) {
              this.logger.error(
                `Failed to copy output file from isolate box ${box} at from ${outputFile.name} to ${outputFile.path}: ${e}`,
              );
            }
          }),
        );
      }
      if (metadata.killed === '1') {
        exitCode = '1';
      }
      if (metadata.exitsig) {
        exitCode = metadata.exitsig;
      }
      if (metadata.exitcode) {
        exitCode = metadata.exitcode;
      }
      exitCode = +exitCode;
      const isolateOutput = metadata.message ? metadata.message + '\n' : '';
      return { exitCode, isolateOutput, output, metadata };
    } finally {
      const cleanupStatuses = await Promise.allSettled([
        shell.exec(
          `isolate --cleanup -b ${box}`,
          ConfigConstants.isolate.baseCommandTimeout,
        ),
        fs.promises.unlink(metadataFilePath),
      ]);
      if (cleanupStatuses[0].status === 'rejected') {
        this.logger.error(
          `Failed to cleanup isolate box ${box}: ${cleanupStatuses[0].reason}`,
        );
      }
      this.availableBoxes.push(box);
      release();
    }
  }
}

export interface ExecutionOptions {
  stdin?: string;
  inputFiles?: { name: string; path: string }[];
  inputTexts?: { name: string; text: string }[];
  outputFiles?: { name: string; path: string }[];
  processLimit?: number | null;
  inheritEnvironment?: boolean;
  memoryLimit?: number;
  timeLimit?: number;
  wallTimeLimit?: number;
  openFilesLimit?: number;
  fileSizeLimit?: number;
}

export interface ExecutionResult {
  exitCode: number;
  isolateOutput: string;
  output: string;
  metadata: { [key: string]: string };
}
