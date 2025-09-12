import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  timeout: 30_000,
  use: {
    baseURL: process.env.APP_URL || 'http://127.0.0.1:4173',
    headless: true,
    trace: 'off',
  },
});
