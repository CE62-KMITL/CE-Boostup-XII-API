import * as fs from 'fs';
import { join } from 'path';

import { InternalServerErrorException } from '@nestjs/common';

import { ConfigConstants } from './config/config-constants';
import { execAsync } from './exec-async';
import { loadKeyValue } from './load-key-value';

export class Executor {
  constructor(
    boxesRoot: string,
    boxCount: number,
    metadataStoragePath: string,
    logger: any = console,
  ) {
    this.boxesRoot = boxesRoot;
    this.metadataStoragePath = metadataStoragePath;
    this.boxStatuses = Array(boxCount).fill(BoxStatus.Idle);
    this.logger = logger;
  }

  private boxesRoot: string;
  private metadataStoragePath: string;
  private boxStatuses: BoxStatus[];
  private logger: any;

  async execute(
    command: string,
    options: ExecutionOptions,
  ): Promise<ExecutionResult> {
    let box = -1;
    while (box === -1) {
      box = this.boxStatuses.findIndex((status) => status === BoxStatus.Idle);
      if (box !== -1) {
        break;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, ConfigConstants.executor.boxPollInterval),
      );
    }
    this.boxStatuses[box] = BoxStatus.Running;
    const metadataFilePath = join(this.metadataStoragePath, `${box}.txt`);
    try {
      try {
        await execAsync(`isolate --init -b ${box}`, {
          encoding: 'utf-8',
          timeout: ConfigConstants.isolate.baseCommandTimeout,
        });
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
      if (options.environment) {
        fullCommandList.push('-e');
      }
      fullCommandList.push('--stderr-to-stdout');
      fullCommandList.push('-o');
      fullCommandList.push('output.txt');
      fullCommandList.push('-M');
      fullCommandList.push(metadataFilePath);
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
          Math.max(options.timeLimit * 1.5, options.timeLimit + 5);
      }
      if (options.wallTimeLimit) {
        commandTimeout =
          ConfigConstants.isolate.baseCommandTimeout + options.wallTimeLimit;
      }
      let isolateOutput = '';
      try {
        const { stderr } = await execAsync(fullCommand, {
          encoding: 'utf-8',
          timeout: commandTimeout,
          env: options.environment,
        });
        isolateOutput = stderr;
      } catch (e) {
        this.logger.log(
          `Failed to execute user provided command: ${fullCommand}: ${e}`,
        );
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
      let metadata = {};
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
      return { isolateOutput, output, metadata };
    } finally {
      try {
        await Promise.all([
          execAsync(`isolate --cleanup -b ${box}`, {
            encoding: 'utf-8',
            timeout: ConfigConstants.isolate.baseCommandTimeout,
          }),
          fs.promises.unlink(metadataFilePath),
        ]);
      } catch (e) {}
      this.boxStatuses[box] = BoxStatus.Idle;
    }
  }
}

export interface ExecutionOptions {
  inputFiles?: { name: string; path: string }[];
  inputTexts?: { name: string; text: string }[];
  processLimit?: number | null;
  environment?: { [key: string]: string };
  memoryLimit?: number;
  timeLimit?: number;
  wallTimeLimit?: number;
  fileSizeLimit?: number;
}

export interface ExecutionResult {
  isolateOutput: string;
  output: string;
  metadata: { [key: string]: string };
}

enum BoxStatus {
  Idle = 'Idle',
  Running = 'Running',
}
