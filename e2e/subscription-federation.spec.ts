import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasSubscriptionRemote = fs.existsSync(
  `${DIST_ROOT}/subscription/mf-manifest.json`,
);

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const plans = [
  {
    id: 'plan-free',
    name: 'FREE',
    price_monthly_rs: 0,
    seat_limit: 1,
    included_modules: ['pos'],
  },
  {
    id: 'plan-starter',
    name: 'STARTER',
    price_monthly_rs: 499,
    seat_limit: 3,
    included_modules: ['pos', 'khata'],
  },
  {
    id: 'plan-growth',
    name: 'RETAIL_PRO',
    price_monthly_rs: 1499,
    included_modules: ['analytics'],
  },
  {
    id: 'plan-pro',
    name: 'ENTERPRISE',
    price_monthly_rs: null,
    custom_price: true,
  },
];

async function seedSession(
  page: Page,
  role: 'pharmacy_owner' | 'pharmacy_staff',
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
        data: {
          pharmacy_id: PHARMACY_ID,
          status: 'ACTIVE',
          plan: 'FREE',
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
        plan: 'FREE',
        pharmacyStatus: 'ACTIVE',
        permissions: ['*'],
        tokenScope: 'full',
      }),
    },
  );
}

test.describe('subscription federation', () => {
  test.skip(!hasSubscriptionRemote, 'subscription remote dist is not built');

  test('owner catalogue uses display labels and subscribe idempotency', async ({
    page,
  }) => {
    const keys: string[] = [];
    await seedSession(page, 'pharmacy_owner');
    await page.route('**/api/v1/pharmacy/subscription/plans', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: plans }),
      });
    });
    await page.route('**/api/v1/pharmacy/subscription', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { current_plan: 'FREE', status: 'ACTIVE', auto_renew: true },
          }),
        });
        return;
      }
      await route.fallback();
    });
    await page.route(
      '**/api/v1/pharmacy/subscription/subscribe',
      async (route) => {
        keys.push(route.request().headers()['idempotency-key'] ?? '');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { current_plan: 'STARTER', status: 'ACTIVE' },
          }),
        });
      },
    );
    await page.goto('/subscription');
    await expect(page.getByTestId('plans-matrix')).toBeVisible();
    await expect(page.getByTestId('plan-card-RETAIL_PRO')).toContainText(
      'Growth',
    );
    await expect(page.getByTestId('current-plan-chip')).toContainText('Free');
    await page
      .getByTestId('plan-card-STARTER')
      .getByRole('button', { name: 'Subscribe' })
      .click();
    await page.getByRole('button', { name: 'Subscribe' }).click();
    await expect(page.getByTestId('toast')).toHaveText('Subscription updated');
    expect(keys[0]).toBeTruthy();
  });

  test('staff cannot change plans', async ({ page }) => {
    await seedSession(page, 'pharmacy_staff');
    await page.route('**/api/v1/pharmacy/subscription/plans', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'FORBIDDEN' },
        }),
      });
    });
    await page.route('**/api/v1/pharmacy/subscription', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { current_plan: 'STARTER' },
        }),
      });
    });
    await page.goto('/subscription');
    await expect(page.getByTestId('plans-forbidden')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Subscribe' })).toHaveCount(
      0,
    );
  });

  test('billing return URL refetches and stays processing', async ({
    page,
  }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route('**/api/v1/pharmacy/billing/invoices', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'inv-1', status: 'unpaid', amount_rs: 499 }],
        }),
      });
    });
    await page.route(
      '**/api/v1/pharmacy/billing/invoices/inv-return',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'inv-return', status: 'unpaid', amount_rs: 499 },
          }),
        });
      },
    );
    await page.goto('/billing?invoice_id=inv-return');
    await expect(page.getByTestId('billing-processing')).toBeVisible();
  });
});
