import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

import { Logger } from '@nestjs/common';
import terminate from 'terminate/promise';

class ExecException extends Error {
  cmd?: string;
  killed?: boolean;
  code?: number | null;
  signal?: NodeJS.Signals;
  stdout?: string;
  stderr?: string;

  constructor(
    cmd?: string,
    killed?: boolean,
    code?: number | null,
    signal?: NodeJS.Signals,
    stdout?: string,
    stderr?: string,
  ) {
    super(`Command failed: exit ${code}`);
    this.cmd = cmd;
    this.killed = killed;
    this.code = code;
    this.signal = signal;
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

export class Shell {
  private shell: ChildProcessWithoutNullStreams;
  private readonly id: number;
  private readonly shellPath: string;
  private readonly env: { [key: string]: string };
  private readonly logger: any;
  private running: boolean = false;
  private initialized: boolean = false;
  private cmd: string = '';
  private stdout: string = '';
  private stderr: string = '';
  private resolve: (
    value:
      | { stdout: string; stderr: string }
      | PromiseLike<{ stdout: string; stderr: string }>,
  ) => void;
  private reject: (reason?: ExecException | PromiseLike<ExecException>) => void;
  private timer: NodeJS.Timeout;

  constructor(
    id: number,
    shellPath: string = '/bin/sh',
    env: { [key: string]: string } = {},
  ) {
    this.id = id;
    this.shellPath = shellPath;
    this.env = env;
    this.logger = new Logger(Shell.name + '-' + this.id.toString());
    this.createShell();
  }

  createShell(): void {
    this.logger.log(`Initializing shell ${this.shellPath}`);
    this.shell = spawn(this.shellPath, {
      stdio: 'pipe',
      env: this.env,
    });
    this.logger.log(`Shell ${this.shellPath} created`);
    this.addEventListeners();
    this.logger.log(`Event listeners added`);
    this.initialized = true;
  }

  addEventListeners(): void {
    this.shell.stdout.on('data', (data: Buffer) => {
      if (!this.running) {
        return;
      }
      this.stdout += data.toString();
      if (this.stdout.endsWith('_Bh7H\n')) {
        const match = this.stdout.match(/Bh7H_EXITCODE=(\d+?)_Bh7H\n$/);
        if (!match) {
          return;
        }
        this.running = false;
        clearTimeout(this.timer);
        const exitCode = parseInt(match[1]);
        const stdout = this.stdout.replace(/Bh7H_EXITCODE=(\d+?)_Bh7H\n$/, '');
        const stderr = this.stderr;
        this.stdout = '';
        this.stderr = '';
        if (exitCode === 0) {
          this.resolve({ stdout: stdout, stderr: stderr });
        } else {
          this.reject(
            new ExecException(
              this.cmd,
              false,
              exitCode,
              undefined,
              stdout,
              stderr,
            ),
          );
        }
      }
    });
    this.shell.stderr.on('data', (data: Buffer) => {
      if (!this.running) {
        return;
      }
      this.stderr += data.toString();
    });
  }

  async timeout(): Promise<void> {
    if (!this.running) {
      return;
    }
    this.initialized = false;
    this.running = false;
    this.logger.error(`Shell ${this.shellPath} timed out, restarting`);
    this.logger.log(`Killing shell ${this.shellPath}`);
    if (this.shell.pid) {
      try {
        await terminate(this.shell.pid);
      } catch (e) {
        this.logger.error(
          `Failed to kill shell ${this.shellPath} error: ${e}, trying .kill()`,
        );
        this.shell.kill();
      }
    } else {
      this.logger.error(`Shell ${this.shellPath} has no PID, trying .kill()`);
      this.shell.kill();
    }
    this.logger.log(`Shell ${this.shellPath} killed`);
    this.createShell();
    this.reject(
      new ExecException(
        this.cmd,
        true,
        null,
        'SIGKILL',
        this.stdout,
        this.stderr,
      ),
    );
  }

  async exec(
    cmd: string,
    timeout: number = 1000,
  ): Promise<{ stdout: string; stderr: string }> {
    if (this.running) {
      throw new Error('Shell is already running');
    }
    if (!this.initialized) {
      throw new Error('Shell is not initialized');
    }
    this.logger.debug(`Executing command: ${cmd}`);
    this.running = true;
    this.cmd = cmd;
    this.timer = setTimeout(() => this.timeout(), timeout);
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.shell.stdin.write(`${cmd}; echo Bh7H_EXITCODE=$?_Bh7H\n`);
    });
  }
}
