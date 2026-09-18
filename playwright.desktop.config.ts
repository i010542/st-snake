import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/desktop',
  fullyParallel: false,
  retries: 0,
  timeout: 60_000,
  use: {
    trace: 'off',
  },
});
