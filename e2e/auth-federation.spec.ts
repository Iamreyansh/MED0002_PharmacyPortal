import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const AUTH_MANIFEST =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasAuthRemote = fs.existsSync(`${AUTH_MANIFEST}/auth/mf-manifest.json`);

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const loginData = {
  access_token: 'access',
  refresh_token: 'refresh',
  token_type: 'Bearer',
  access_token_expires_in: 900,
  active_pharmacy: {
    id: PHARMACY_ID,
    name: 'Sri Rama Medicals',
    subscription_plan: 'FREE',
  },
  staff: {
    id: STAFF_ID,
    name: 'Priya Sharma',
    role: 'pharmacy_owner',
  },
  pharmacies: [
    {
      id: PHARMACY_ID,
      name: 'Sri Rama Medicals',
      role: 'pharmacy_owner',
      is_active: true,
    },
  ],
};

async function mockCore(page: Page) {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: STAFF_ID,
          name: 'Priya Sharma',
          role: 'pharmacy_owner',
          permissions: ['*'],
          active_pharmacy: { id: PHARMACY_ID, name: 'Sri Rama Medicals' },
        },
      }),
    });
  });
  await page.route('**/api/v1/pharmacy/registration-status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { pharmacy_id: PHARMACY_ID, status: 'ACTIVE', plan: 'FREE' },
      }),
    });
  });
}

async function seedSession(page: Page) {
  await page.addInitScript(
    ({ tokens, snapshot }) => {
      sessionStorage.setItem('medmate.portal.tokens', tokens);
      sessionStorage.setItem('medmate.portal.session', snapshot);
    },
    {
      tokens: JSON.stringify({
        accessToken: 'access',
        refreshToken: 'refresh',
        tokenType: 'Bearer',
        tokenScope: 'full',
        accessTokenExpiresAt: Date.now() + 60_000,
      }),
      snapshot: JSON.stringify({
        pharmacies: loginData.pharmacies.map((row) => ({
          id: row.id,
          name: row.name,
          role: row.role,
          isActive: row.is_active,
        })),
        staffId: STAFF_ID,
        staffName: 'Priya Sharma',
        pharmacyId: PHARMACY_ID,
        pharmacyName: 'Sri Rama Medicals',
        role: 'pharmacy_owner',
        plan: 'FREE',
        pharmacyStatus: 'ACTIVE',
        permissions: ['*'],
        tokenScope: 'full',
      }),
    },
  );
}

test.describe('auth federation contract', () => {
  test.skip(
    !hasAuthRemote,
    'Build @medmate/auth (pnpm --filter @medmate/auth build) so dist/auth exists',
  );

  test('login happy path against the auth remote', async ({ page }) => {
    await page.route('**/api/v1/auth/pharmacy/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: loginData }),
      });
    });
    await mockCore(page);
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await page.getByLabel('Email or mobile').fill('priya@srirama.in');
    await page.getByLabel('Password').fill('Secret123!');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByTestId('portal-home')).toBeVisible();
    await expect(page.getByTestId('session-menu')).toHaveText('Priya Sharma');
  });

  test('Counter PIN remounts the POS remote', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await page.getByRole('button', { name: 'Counter PIN sign-in' }).click();
    await expect(page).toHaveURL(/\/pos-login$/);
    await expect(
      page.getByRole('heading', { name: 'POS sign in' }),
    ).toBeVisible();
    await expect(page.getByLabel('Pharmacy ID')).toBeVisible();
  });

  test('PIN login against the auth remote', async ({ page }) => {
    await page.route('**/api/v1/auth/pharmacy/pos-pin', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            access_token: 'pos-access',
            token_type: 'Bearer',
            token_scope: 'pos',
            access_token_expires_in: 14400,
            staff: { id: STAFF_ID, name: 'Kavya Nair', role: 'cashier' },
            pharmacy: { id: PHARMACY_ID, name: 'Sri Rama Medicals' },
          },
        }),
      });
    });
    await page.goto('/pos-login');
    await expect(
      page.getByRole('heading', { name: 'POS sign in' }),
    ).toBeVisible();
    await page.getByLabel('Pharmacy ID').fill(PHARMACY_ID);
    await page.getByLabel('Staff ID').fill(STAFF_ID);
    await page.getByRole('button', { name: '1' }).click();
    await page.getByRole('button', { name: '2' }).click();
    await page.getByRole('button', { name: '3' }).click();
    await page.getByRole('button', { name: '4' }).click();
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/pos$/);
  });

  test('sessions revoke dialog against the auth remote', async ({ page }) => {
    await mockCore(page);
    await seedSession(page);
    await page.route('**/api/v1/auth/sessions**', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { session_id: 's1', message: 'Session revoked.' },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              session_id: 's1',
              ip_address: '1.1.1.1',
              user_agent: 'Chrome',
              last_active_at: '2026-08-26T12:00:00.000Z',
            },
          ],
          meta: { page: 1, limit: 20, total: 1, has_next: false },
        }),
      });
    });
    await page.goto('/sessions');
    await expect(page.getByRole('heading', { name: 'Sessions' })).toBeVisible();
    await page.getByRole('button', { name: 'Revoke' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
