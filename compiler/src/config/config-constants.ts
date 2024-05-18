export const ConfigConstants = {
  isolate: {
    max_box_count: 64,
    box_root: '/var/local/lib/isolate/',
  },
  compiler: {
    maxCodeLength: 65535,
    defaultTimeLimit: 15,
    defaultMemoryLimit: 65535,
    maxTimeLimit: 60,
    maxMemoryLimit: 262144,
  },
  executor: {
    maxInputCount: 4096,
    maxInputLength: 65535,
    defaultTimeLimit: 1,
    defaultMemoryLimit: 16384,
    maxTimeLimit: 30,
    maxMemoryLimit: 262144,
  },
};
