import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for auto-fill scripts.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',

  /* Run tests in files sequentially (forms have shared state) */
  fullyParallel: false,

  /* Fail on CI if test.only is left in */
  forbidOnly: !!process.env.CI,

  /* Retry flaky tests caused by Docker stack instability */
  retries: process.env.CI ? 1 : 2,

  /* Single worker to avoid concurrency issues on shared local server */
  workers: 1,

  /* Reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  /* Double default test timeout (60s) to allow for slow local Docker stack */
  timeout: 60_000,

  /* Double default expect timeout (10s) for slow local Docker stack */
  expect: {
    timeout: 10_000,
  },

  /* Shared settings */
  use: {
    /* Collect trace on first retry */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Increase default timeout for uploads and autocomplete dropdowns */
    actionTimeout: 30_000,
  },

  /* Run against Chromium only by default for speed */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
