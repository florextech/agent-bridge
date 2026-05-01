import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: [
    {
      command: 'cd ../api && DATABASE_URL="postgresql://bridge:bridge@localhost:5432/agent_bridge_test" node dist/main.js',
      port: 3001,
      reuseExistingServer: true,
    },
    {
      command: 'AUTH_SECRET=test-e2e NEXT_PUBLIC_API_URL=http://localhost:3001 pnpm start',
      port: 3000,
      reuseExistingServer: true,
    },
  ],
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
