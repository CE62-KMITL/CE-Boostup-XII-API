export const ConfigConstants = {
  isolate: {
    max_box_count: 64,
    box_root: '/var/local/lib/isolate/',
  },
  compiler: {
    maxCodeLength: 65535,
    defaultTimeLimit: 15,
    defaultMemoryLimit: 64 * 1024 * 1024,
    maxTimeLimit: 60,
    maxMemoryLimit: 256 * 1024 * 1024,
    maxExecutableSize: 64 * 1024 * 1024,
  },
  executor: {
    maxInputCount: 4096,
    maxInputSize: 65536,
    maxOutputSize: 65536,
    defaultTimeLimit: 1,
    defaultMemoryLimit: 16 * 1024 * 1024,
    maxTimeLimit: 30,
    maxMemoryLimit: 64 * 1024 * 1024,
  },
};
