import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    // Port 3100 is the test server backed by the mobcheck_test database.
    baseURL: process.env.BASE_URL || 'http://localhost:3100',
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'laptop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1280, height: 720 } }, grep: /@responsive/ },
    { name: 'tablet', use: { ...devices['iPad (gen 7)'], browserName: 'chromium', channel: 'chrome' }, grep: /@responsive/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome' }, grep: /@responsive|@mobile/ },
  ],
});
