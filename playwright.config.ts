import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  testIgnore: [
    '**/auth-federation.spec.ts',
    '**/onboarding-federation.spec.ts',
    '**/settings-federation.spec.ts',
    '**/subscription-federation.spec.ts',
    '**/catalogue-federation.spec.ts',
    '**/inventory-federation.spec.ts',
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    env: {
      // Do not register remotes: federation auto-init of a failing
      // manifest blocks host bootstrap.
      VITE_MFE_DOMAIN_SUFFIX: '',
      VITE_REMOTE_TODO_URL: '',
      VITE_REMOTE_POS_URL: '',
      VITE_REMOTE_AUTH_URL: '',
      VITE_REMOTE_ONBOARDING_URL: '',
      VITE_ENABLE_DEMO_REMOTES: '',
      VITE_DISABLE_LOCAL_MFE_DIST: 'true',
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
