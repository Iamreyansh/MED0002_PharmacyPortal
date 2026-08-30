import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasInventoryRemote = fs.existsSync(
  `${DIST_ROOT}/inventory/mf-manifest.json`,
);

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

async function seedSession(
  page: Page,
  role: 'pharmacy_owner' | 'pharmacy_staff',
  plan: 'FREE' | 'RETAIL_PRO' = 'FREE',
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
        permissions: ['*'],
        tokenScope: 'full',
      }),
    },
  );
}

test.describe('inventory federation', () => {
  test.skip(!hasInventoryRemote, 'inventory remote dist is not built');

  test('detail 404 shows not-found', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route(
      '**/api/v1/pharmacy/inventory/missing**',
      async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'PRODUCT_NOT_FOUND', message: 'Gone' },
          }),
        });
      },
    );
    await page.goto('/inventory/missing');
    await expect(page.getByTestId('inventory-not-found')).toBeVisible();
  });

  test('expiry alerts render with a product link', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route(
      '**/api/v1/pharmacy/inventory/expiry-alerts**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              alerts: [
                {
                  product_id: 'prod-1',
                  name: 'Crocin 500mg Tablet',
                  expiry_date: '2026-09-15',
                  quantity: 4,
                },
              ],
            },
          }),
        });
      },
    );
    await page.route(
      '**/api/v1/pharmacy/inventory/expiry-report**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { report: [] } }),
        });
      },
    );
    await page.goto('/inventory/expiry');
    await expect(page.getByTestId('expiry-alerts')).toBeVisible();
    await expect(page.getByTestId('expiry-alert-prod-1')).toContainText(
      'Crocin 500mg Tablet',
    );
    await expect(
      page.getByRole('button', { name: 'Open product' }),
    ).toBeVisible();
  });

  test('owner confirms rack delete', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route('**/api/v1/pharmacy/rack-locations**', async (route) => {
      const url = route.request().url();
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { rack_code: 'A1', deleted: true },
          }),
        });
        return;
      }
      if (url.includes('/unlocated')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { unlocated: [] } }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            racks: [
              { rack_code: 'A1', name: 'Counter left', product_count: 3 },
            ],
          },
        }),
      });
    });
    await page.goto('/racks');
    await expect(page.getByTestId('rack-row-A1')).toBeVisible();
    await page.getByRole('button', { name: 'Delete rack' }).click();
    await expect(page.getByTestId('rack-delete-dialog')).toBeVisible();
    await page
      .getByTestId('rack-delete-dialog')
      .getByRole('button', { name: 'Delete rack' })
      .click();
    await expect(page.getByTestId('toast')).toHaveText('Rack removed');
  });

  test('Growth owner PATCH online visibility', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner', 'RETAIL_PRO');
    let patched = false;
    await page.route('**/api/v1/pharmacy/inventory/prod-1**', async (route) => {
      if (
        route.request().method() === 'PATCH' &&
        !route.request().url().includes('/batches')
      ) {
        patched = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              product_id: 'prod-1',
              name: 'Crocin 500mg Tablet',
              is_online_visible: true,
            },
          }),
        });
        return;
      }
      if (route.request().url().includes('/batches')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              batches: [
                {
                  batch_id: 'batch-1',
                  batch_number: 'B1',
                  expiry_date: '2026-12-01',
                  quantity: 20,
                },
              ],
            },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            product_id: 'prod-1',
            name: 'Crocin 500mg Tablet',
            is_online_visible: false,
            rack_location_code: 'A1',
          },
        }),
      });
    });
    await page.goto('/inventory/prod-1');
    await expect(page.getByTestId('inventory-product')).toBeVisible();
    await page.getByLabel('List on online storefront').click();
    await expect(page.getByTestId('toast')).toHaveText('Product updated');
    expect(patched).toBe(true);
  });
});
