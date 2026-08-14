import { defineConfig } from '@playwright/test';

const PORTA = 3100;

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  use: { baseURL: `http://localhost:${PORTA}`, trace: 'retain-on-failure' },
  webServer: {
    command: `npx vite --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
