export const ConfigConstants = {
  isolate: {
    max_box_count: 64,
    box_root: '/var/local/lib/isolate/',
    baseCommandTimeout: 1000,
  },
  compiler: {
    maxCodeLength: 65535,
    defaultTimeLimit: 15,
    defaultMemoryLimit: 256 * 1024 * 1024,
    maxTimeLimit: 60,
    maxMemoryLimit: 512 * 1024 * 1024,
    maxExecutableSize: 64 * 1024 * 1024,
  },
  executor: {
    boxPollInterval: 100,
    maxInputCount: 4 * 1024,
    maxInputSize: 256 * 1024,
    maxOutputSize: 16 * 1024 * 1024,
    defaultTimeLimit: 1,
    defaultMemoryLimit: 64 * 1024 * 1024,
    maxTimeLimit: 30,
    maxMemoryLimit: 256 * 1024 * 1024,
  },
};
