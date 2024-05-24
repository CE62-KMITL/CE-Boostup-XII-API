// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default () => ({
  storages: {
    temporary: {
      path: process.env.TEMPORARY_STORAGE_LOCATION || '/tmp/ce-boostup-xii/',
    },
  },
  executor: {
    wallTimeLimitMultiplier: process.env.WALL_TIME_LIMIT_MULTIPLIER
      ? +process.env.WALL_TIME_LIMIT_MULTIPLIER
      : 1.5,
    wallTimeLimitOffset: process.env.WALL_TIME_LIMIT_OFFSET
      ? +process.env.WALL_TIME_LIMIT_OFFSET
      : 5,
  },
  isolate: {
    boxCount: process.env.ISOLATE_BOX_COUNT
      ? +process.env.ISOLATE_BOX_COUNT
      : 16,
  },
  compiler: {
    march: process.env.COMPILER_MARCH || 'native',
    mtune: process.env.COMPILER_MTUNE || 'native',
  },
});
