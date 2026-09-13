import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/web', workers: 1, timeout: 45000, maxFailures: 1,
  expect: { timeout: 15000 }, reporter: [['list'], ['json', { outputFile: '.acceptance/web-results.json' }]],
  use: { headless: true, actionTimeout: 10000, viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.TABILET_CHROMIUM ? { executablePath: process.env.TABILET_CHROMIUM } : {},
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
});
