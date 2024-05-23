export const ConfigConstants = {
  user: {
    maxEmailLength: 255, // Must be less than or equal to 65535
    minDisplayNameLength: 1, // Must be less than or equal to 65535
    maxDisplayNameLength: 32, // Must be less than or equal to 65535
    minPasswordLength: 8, // Must be less than or equal to 65535
    maxPasswordLength: 255, // Must be less than or equal to 65535
  },
  group: {
    minNameLength: 1, // Must be less than or equal to 65535
    maxNameLength: 32, // Must be less than or equal to 65535
    maxDescriptionLength: 65535, // Must be less than or equal to 65535
  },
  problemTag: {
    minNameLength: 1, // Must be less than or equal to 65535
    maxNameLength: 32, // Must be less than or equal to 65535
    maxDescriptionLength: 65535, // Must be less than or equal to 65535
  },
  problem: {
    minTitleLength: 1, // Must be less than or equal to 65535
    maxTitleLength: 255, // Must be less than or equal to 65535
    maxDescriptionLength: 65535, // Must be less than or equal to 65535
    maxInputLength: 65535, // Must be less than or equal to 65535
    maxOutputLength: 65535, // Must be less than or equal to 65535
    maxHintLength: 65535, // Must be less than or equal to 65535
    minTestcaseCount: 1,
    maxTestcaseCount: 4096,
    minExampleTestcaseCount: 0,
    maxExampleTestcaseCount: 16,
    maxTestcaseInputLength: 65535,
    maxTestcaseOutputLength: 65535,
    maxStarterCodeLength: 65535, // Must be less than or equal to 65535
    maxSolutionLength: 65535, // Must be less than or equal to 65535
    maxTimeLimit: 30,
    maxMemoryLimit: 262144, // Must be less than or equal to 2147483648
    minDifficulty: 1,
    maxDifficulty: 5,
    maxCreditsLength: 255, // Must be less than or equal to 65535
  },
  save: {
    maxCodeLength: 65535, // Must be less than or equal to 65535
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
    maxOpenFiles: 4, // stdin, stdout, stderr, libc.so.6
    defaultTimeLimit: 1,
    defaultMemoryLimit: 64 * 1024 * 1024,
    maxTimeLimit: 30,
    maxMemoryLimit: 256 * 1024 * 1024,
  },
};
