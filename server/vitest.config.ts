import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    include: [
      'src/tests/unit/**/*.test.{ts,tsx}',
      'src/tests/integration/**/*.test.{ts,tsx}',
    ],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
