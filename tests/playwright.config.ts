import { defineConfig } from '@playwright/test';
import { assertLocalStack, BASE_URL } from './stability/guard';

assertLocalStack();

/*
  Edit-mode stability suite. Run with `npm run test:stability`, with the dev
  server on port 3003 against the local Supabase stack and the three
  STABILITY_ADMIN_* variables set (see tests/stability/guard.ts).

  Traces, screenshots and video stay off: the sign-in step handles a
  password and a one-time code, and nothing may record them.
*/
export default defineConfig({
  testDir: './stability',
  outputDir: '../test-results/stability',
  timeout: 420_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    actionTimeout: 15_000,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { browserName: 'chromium', storageState: 'tests/.auth/state.json' },
    },
    {
      name: 'firefox',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { browserName: 'firefox', storageState: 'tests/.auth/state.json' },
    },
  ],
  webServer: {
    command: 'npm run dev -- -p 3003',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
