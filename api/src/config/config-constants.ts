import { LogLevel } from '@nestjs/common';

export const ConfigConstants = {
  logLevels: ['fatal', 'error', 'warn', 'log', 'verbose'] as LogLevel[], //, 'debug'],
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
    maxTestcaseCount: 64,
    minExampleTestcaseCount: 0,
    maxExampleTestcaseCount: 16,
    maxTestcaseInputLength: 256 * 1024,
    maxTestcaseOutputLength: 16 * 1024 * 1024,
    maxStarterCodeLength: 65535, // Must be less than or equal to 65535
    maxSolutionLength: 65535, // Must be less than or equal to 65535
    defaultTimeLimit: 1,
    maxTimeLimit: 5,
    defaultMemoryLimit: 32 * 1024 * 1024, // Must be less than or equal to 2147483648
    maxMemoryLimit: 128 * 1024 * 1024, // Must be less than or equal to 2147483648
    minDifficulty: 1,
    maxDifficulty: 5,
    maxCreditsLength: 255, // Must be less than or equal to 65535
    maxReviewCommentLength: 65535, // Must be less than or equal to 65535
  },
  save: {
    maxCodeLength: 65535, // Must be less than or equal to 65535
  },
  submission: {
    maxCodeLength: 65535, // Must be less than or equal to 65535
  },
  compiler: {
    maxCodeLength: 256 * 1024,
    defaultTimeLimit: 5,
    defaultMemoryLimit: 128 * 1024 * 1024,
    maxTimeLimit: 15,
    maxMemoryLimit: 512 * 1024 * 1024,
  },
  executor: {
    maxInputCount: 16,
    maxInputSize: 256 * 1024,
    maxOutputSize: 16 * 1024 * 1024,
    defaultTimeLimit: 1,
    defaultMemoryLimit: 32 * 1024 * 1024,
    maxTimeLimit: 5,
    maxMemoryLimit: 128 * 1024 * 1024,
  },
  secondaryRateLimits: {
    compileAndRun: { secondary: { ttl: 30000, limit: 12 } },
    createSave: { secondary: { ttl: 30000, limit: 10 } },
    createSubmission: { secondary: { ttl: 30000, limit: 15 } },
    createAttachment: { secondary: { ttl: 60000, limit: 20 } },
  },
};
