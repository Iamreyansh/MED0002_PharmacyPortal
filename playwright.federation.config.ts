import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/auth-federation.spec.ts', '**/onboarding-federation.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 5174',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_MFE_DOMAIN_SUFFIX: '',
      VITE_REMOTE_TODO_URL: '',
      VITE_REMOTE_AUTH_URL: '',
      VITE_REMOTE_ONBOARDING_URL: '',
      VITE_ENABLE_DEMO_REMOTES: '',
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
