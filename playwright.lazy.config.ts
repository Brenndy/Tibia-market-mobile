import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /lazy-(static-data|smoke)\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:50164',
    screenshot: 'only-on-failure',
    locale: 'en-US',
  },
  projects: [
    {
      name: 'desktop',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
  ],
});
