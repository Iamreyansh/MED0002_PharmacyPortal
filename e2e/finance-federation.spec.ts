import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasFinanceRemote = fs.existsSync(`${DIST_ROOT}/finance/mf-manifest.json`);

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const SETTLEMENT_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

async function seedSession(
  page: Page,
  role: 'pharmacy_owner' | 'pharmacy_staff',
  plan: 'FREE' | 'STARTER' = 'FREE',
) {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: STAFF_ID,
          name: 'Priya Sharma',
          role,
          permissions: role === 'pharmacy_staff' ? ['pos:sell'] : ['*'],
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
        data: {
          pharmacy_id: PHARMACY_ID,
          status: 'ACTIVE',
          plan,
        },
      }),
    });
  });
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
        pharmacies: [],
        staffId: STAFF_ID,
        staffName: 'Priya Sharma',
        pharmacyId: PHARMACY_ID,
        pharmacyName: 'Sri Rama Medicals',
        role,
        plan,
        pharmacyStatus: 'ACTIVE',
        permissions: role === 'pharmacy_staff' ? ['pos:sell'] : ['*'],
        tokenScope: 'full',
      }),
    },
  );
}

test.describe('finance federation', () => {
  test.skip(!hasFinanceRemote, 'finance remote dist is not built');

  test('lists settlements and pages without invented commission', async ({
    page,
  }) => {
    await seedSession(page, 'pharmacy_owner');
    let requestedPage = '';
    await page.route(
      '**/api/v1/pharmacy/finance/settlements**',
      async (route) => {
        const url = new URL(route.request().url());
        requestedPage = url.searchParams.get('page') ?? '1';
        const first = requestedPage !== '2';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              settlements: first
                ? [
                    {
                      settlement_id: SETTLEMENT_ID,
                      cycle_from: '2026-08-18',
                      cycle_to: '2026-08-24',
                      net_payable: 118750,
                      status: 'RELEASED',
                      released_at: '2026-08-25T04:30:00Z',
                    },
                  ]
                : [],
            },
            meta: { page: first ? 1 : 2, has_next: first },
          }),
        });
      },
    );
    await page.goto('/finance/settlements');
    await expect(page.getByTestId('settlements-table')).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Net payable' }),
    ).toBeVisible();
    await expect(page.getByText(/gmv −/i)).toHaveCount(0);
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByTestId('settlements-empty')).toBeVisible();
    expect(requestedPage).toBe('2');
  });

  test('shows an empty list', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route(
      '**/api/v1/pharmacy/finance/settlements**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { settlements: [] },
            meta: { page: 1, has_next: false },
          }),
        });
      },
    );
    await page.goto('/finance/settlements');
    await expect(page.getByTestId('settlements-empty')).toBeVisible();
  });

  test('renders detail fields and support CTA', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route(
      `**/api/v1/pharmacy/finance/settlements/${SETTLEMENT_ID}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              settlement_id: SETTLEMENT_ID,
              net_payable: 118625,
              status: 'RELEASED',
              utr: 'AXIS123456',
            },
          }),
        });
      },
    );
    await page.goto(`/finance/settlements/${SETTLEMENT_ID}`);
    await expect(page.getByTestId('settlement-fields')).toBeVisible();
    await expect(
      page.getByTestId('settlement-field-net_payable'),
    ).toBeVisible();
    await expect(page.getByText(/gmv −/i)).toHaveCount(0);
    await page.getByRole('button', { name: 'Raise a support ticket' }).click();
    await expect(page).toHaveURL(/\/support\/new/);
  });

  test('shows not-found for an unknown settlement', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route(
      `**/api/v1/pharmacy/finance/settlements/${SETTLEMENT_ID}`,
      async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'SETTLEMENT_NOT_FOUND', message: 'Missing' },
          }),
        });
      },
    );
    await page.goto(`/finance/settlements/${SETTLEMENT_ID}`);
    await expect(page.getByTestId('settlement-not-found')).toBeVisible();
  });

  test('staff see a forbidden state without a table', async ({ page }) => {
    await seedSession(page, 'pharmacy_staff');
    await page.goto('/finance/settlements');
    await expect(page.getByTestId('settlements-error')).toBeVisible();
    await expect(page.getByTestId('settlements-table')).toHaveCount(0);
  });
});
