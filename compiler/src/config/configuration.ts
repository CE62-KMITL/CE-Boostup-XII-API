// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default () => ({
  storages: {
    temporary: {
      path: process.env.TEMPORARY_STORAGE_LOCATION || '/tmp/ce-boostup-xii/',
    },
  },
});
