import { LogLevel } from '@nestjs/common';

export const ConfigConstants = {
  logLevels: ['fatal', 'error', 'warn', 'log', 'verbose'] as LogLevel[], //, 'debug'],
  isolate: {
    box_root: '/var/local/lib/isolate/',
    baseCommandTimeout: 3000,
  },
  compiler: {
    maxCodeLength: 256 * 1024,
    defaultTimeLimit: 5,
    defaultMemoryLimit: 128 * 1024 * 1024,
    maxTimeLimit: 15,
    maxMemoryLimit: 512 * 1024 * 1024,
    maxExecutableSize: 64 * 1024 * 1024,
  },
  executor: {
    maxInputCount: 80,
    maxInputSize: 256 * 1024,
    maxOutputSize: 16 * 1024 * 1024,
    maxOpenFiles: 4, // stdin, stdout, stderr, libc.so.6
    defaultTimeLimit: 1,
    defaultMemoryLimit: 32 * 1024 * 1024,
    maxTimeLimit: 5,
    maxMemoryLimit: 128 * 1024 * 1024,
  },
};
