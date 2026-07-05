import { defineConfig, devices } from '@playwright/test';

/**
 * Expects the stack to be running: db (docker compose up -d db, migrated + seeded),
 * api on :3001 and web on :3000. See README "End-to-end tests".
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
