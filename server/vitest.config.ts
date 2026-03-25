import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/**/*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
