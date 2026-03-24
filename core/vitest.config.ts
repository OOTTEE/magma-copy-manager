import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    poolOptions: {
      threads: {
        isolate: false
      }
    },
    fileParallelism: false
  },
});
