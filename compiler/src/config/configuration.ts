// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default () => ({
  storages: {
    temporary: {
      path: process.env.TEMPORARY_STORAGE_LOCATION || '/tmp/ce-boostup-xii/',
    },
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
