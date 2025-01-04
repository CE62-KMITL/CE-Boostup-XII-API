import { LogLevel } from '@nestjs/common';

export const ConfigConstants = {
  logLevels: ['fatal', 'error', 'warn', 'log', 'verbose'] as LogLevel[], //, 'debug'],
  user: {
    maxEmailLength: 255, // Must be less than 16384
    minDisplayNameLength: 1, // Must be less than 16384
    maxDisplayNameLength: 32, // Must be less than 16384
    minPasswordLength: 8,
    maxPasswordLength: 255,
  },
  group: {
    minNameLength: 1, // Must be less than 16384
    maxNameLength: 32, // Must be less than 16384
    maxDescriptionLength: 16383, // Must be less than 16384
  },
  problemTag: {
    minNameLength: 1, // Must be less than 16384
    maxNameLength: 32, // Must be less than 16384
    maxDescriptionLength: 16383, // Must be less than 16384
  },
  problem: {
    minTitleLength: 1, // Must be less than 16384
    maxTitleLength: 255, // Must be less than 16384
    maxDescriptionLength: 16383, // Must be less than 16384
    maxInputLength: 16383, // Must be less than 16384
    maxOutputLength: 16383, // Must be less than 16384
    maxHintLength: 16383, // Must be less than 16384
    minTestcaseCount: 1,
    maxTestcaseCount: 64,
    minExampleTestcaseCount: 0,
    maxExampleTestcaseCount: 16,
    maxTestcaseInputLength: 16 * 1024 * 1024,
    maxTestcaseOutputLength: 16 * 1024 * 1024,
    maxStarterCodeLength: 32767, // Must be less than 32768
    maxSolutionLength: 32767, // Must be less than 32768
    defaultTimeLimit: 1,
    maxTimeLimit: 5,
    defaultMemoryLimit: 32 * 1024 * 1024, // Must be less than 2147483648
    maxMemoryLimit: 128 * 1024 * 1024, // Must be less than 2147483648
    minDifficulty: 1,
    maxDifficulty: 5,
    maxCreditsLength: 255, // Must be less than 16384
    maxReviewCommentLength: 16383, // Must be less than 16384
  },
  save: {
    maxCodeLength: 32767, // Must be less than 32768
  },
  submission: {
    maxCodeLength: 32767, // Must be less than 32768
  },
  attachment: {
    maxNameLength: 255, // Must be less than 16384
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
    maxInputSize: 16 * 1024 * 1024,
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
