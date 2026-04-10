import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    isolate: true,
    fileParallelism: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['dist/**', 'node_modules/**']
  },
});
