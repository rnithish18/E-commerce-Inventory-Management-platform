import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', '../tests/unit/**/*.test.ts', '../tests/api/**/*.test.ts', '../tests/webhooks/**/*.test.ts'],
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['src/test-setup.ts', 'dist/**'],
    },
    testTimeout: 30000,
  },
});
