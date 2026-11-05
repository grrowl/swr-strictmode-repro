import { defineConfig } from '@playwright/test';
const baseURL = `http://127.0.0.1:${process.env.PORT ?? 4173}`;
export default defineConfig({
  testDir: './tests', workers: 1, reporter: 'list',
  use: { baseURL },
  webServer: { command: 'node scripts/server.mjs', url: baseURL, reuseExistingServer: true }
});
