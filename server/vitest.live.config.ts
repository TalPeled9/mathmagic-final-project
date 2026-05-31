import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/live/**/*.live.test.ts'],
    env: {
      LOG_LEVEL: 'debug',
      PINO_PRETTY: 'true',
    },
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 120000,
    hookTimeout: 30000,
  },
});
