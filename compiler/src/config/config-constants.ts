export const ConfigConstants = {
  isolate: {
    box_root: '/var/local/lib/isolate/',
    baseCommandTimeout: 3000,
  },
  compiler: {
    maxCodeLength: 256 * 1024,
    defaultTimeLimit: 5,
    defaultMemoryLimit: 128 * 1024 * 1024,
    maxTimeLimit: 30,
    maxMemoryLimit: 512 * 1024 * 1024,
    maxExecutableSize: 64 * 1024 * 1024,
  },
  executor: {
    maxInputCount: 4 * 1024,
    maxInputSize: 256 * 1024,
    maxOutputSize: 16 * 1024 * 1024,
    defaultTimeLimit: 1,
    defaultMemoryLimit: 64 * 1024 * 1024,
    maxTimeLimit: 30,
    maxMemoryLimit: 256 * 1024 * 1024,
  },
};
