import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasAnalyticsRemote = fs.existsSync(
  `${DIST_ROOT}/analytics/mf-manifest.json`,
);

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

async function seedSession(
  page: Page,
  role: 'pharmacy_owner' | 'pharmacy_staff',
  plan: 'FREE' | 'RETAIL_PRO' = 'RETAIL_PRO',
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

test.describe('analytics federation', () => {
  test.skip(!hasAnalyticsRemote, 'analytics remote dist is not built');

  test('renders overview cards for a Growth owner', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner', 'RETAIL_PRO');
    await page.route(
      '**/api/v1/pharmacy/analytics/overview**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              period: '30D',
              financials: {
                net_revenue_paise: 2840000,
                units_sold: 4120,
              },
              top_items: [{ name: 'Metformin 500mg', units_sold: 412 }],
              channel_mix: { online_pct: 68.4, counter_pct: 31.6 },
              payment_mix: [{ method: 'UPI', pct: 54.2 }],
            },
          }),
        });
      },
    );
    await page.goto('/analytics');
    await expect(page.getByTestId('analytics-overview-cards')).toBeVisible();
    await expect(page.getByText('Metformin 500mg')).toBeVisible();
    await expect(page.getByTestId('analytics-channel-mix')).toContainText(
      'Online',
    );
  });

  test('shows a Growth lock on Free', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner', 'FREE');
    await page.goto('/analytics');
    await expect(page.getByTestId('analytics-plan-lock')).toBeVisible();
    await expect(page.getByTestId('analytics-plan-lock')).toContainText(
      'Growth',
    );
  });

  test('toggles a report favorite for the owner', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner', 'RETAIL_PRO');
    await page.route(
      '**/api/v1/pharmacy/analytics/overview**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { financials: { units_sold: 1 } },
          }),
        });
      },
    );
    await page.route(
      '**/api/v1/pharmacy/analytics/reports-catalogue',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              reports: [
                {
                  report_id: 'DAYBOOK',
                  name: 'Day Book',
                  group: 'SUMMARY',
                  is_favorite: false,
                },
              ],
            },
          }),
        });
      },
    );
    let favoriteBody = '';
    await page.route(
      '**/api/v1/pharmacy/analytics/reports/DAYBOOK/favorite',
      async (route) => {
        favoriteBody = route.request().postData() ?? '';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { report_id: 'DAYBOOK', is_favorite: true },
          }),
        });
      },
    );
    await page.goto('/analytics');
    await page.getByTestId('analytics-tab-reports').click();
    await expect(page.getByTestId('analytics-reports-table')).toBeVisible();
    await page.getByTestId('analytics-favorite-DAYBOOK').click();
    await expect.poll(() => favoriteBody).toContain('is_favorite');
    await expect(page.getByTestId('toast')).toContainText('Favorite updated');
  });
});
