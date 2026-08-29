import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasCatalogueRemote = fs.existsSync(
  `${DIST_ROOT}/catalogue/mf-manifest.json`,
);

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

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

test.describe('catalogue federation', () => {
  test.skip(!hasCatalogueRemote, 'catalogue remote dist is not built');

  test('owner search results render names from data', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route(
      '**/api/v1/admin/catalogue/schedule-rules',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              schedules: [{ schedule: 'H', full_name: 'Schedule H' }],
            },
          }),
        });
      },
    );
    await page.route('**/api/v1/pharmacy/catalogue/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            query: 'paracetamol',
            pharmacy_id: PHARMACY_ID,
            results: [
              {
                medicine_id: 'med-para',
                name: 'Crocin 500mg Tablet',
                schedule: 'H',
                is_mapped: false,
                master_mrp: 22.5,
              },
            ],
          },
          meta: { page: 1, limit: 20, total: 1, has_next: false },
        }),
      });
    });
    await page.route(
      '**/api/v1/pharmacy/catalogue-mapping**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { pharmacy_id: PHARMACY_ID, mappings: [] },
            meta: { page: 1, limit: 20, total: 0, has_next: false },
          }),
        });
      },
    );
    await page.goto('/catalogue');
    await page.getByLabel('Search medicines').fill('paracetamol');
    await expect(page.getByTestId('search-results')).toBeVisible();
    await expect(page.getByTestId('search-result-med-para')).toContainText(
      'Crocin 500mg Tablet',
    );
    await expect(page.getByTestId('schedule-med-para')).toContainText(
      'Schedule H',
    );
    await expect(page.getByRole('button', { name: 'Map' })).toBeVisible();
    await page.getByRole('button', { name: 'Map' }).click();
    await expect(page).toHaveURL(
      /\/catalogue\/mapping\?master_medicine_id=med-para/,
    );
    await expect(page.getByTestId('mapping-drawer')).toBeVisible();
    await expect(page.getByLabel('Master medicine ID')).toHaveValue('med-para');
  });

  test('empty query stays on the hint and does not dump results', async ({
    page,
  }) => {
    await seedSession(page, 'pharmacy_owner');
    let searchCalls = 0;
    await page.route(
      '**/api/v1/admin/catalogue/schedule-rules',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { schedules: [] },
          }),
        });
      },
    );
    await page.route('**/api/v1/pharmacy/catalogue/search**', async (route) => {
      searchCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { results: [] } }),
      });
    });
    await page.goto('/catalogue');
    await expect(page.getByTestId('search-hint')).toBeVisible();
    await page.getByLabel('Search medicines').fill('p');
    await expect(page.getByTestId('search-hint')).toBeVisible();
    await expect(page.getByTestId('search-results')).toHaveCount(0);
    expect(searchCalls).toBe(0);
  });

  test('staff cannot create or delete mappings', async ({ page }) => {
    await seedSession(page, 'pharmacy_staff');
    await page.route(
      '**/api/v1/pharmacy/catalogue-mapping**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              pharmacy_id: PHARMACY_ID,
              mappings: [
                {
                  mapping_id: 'map-1',
                  master_medicine_id: 'med-aug',
                  name: 'Augmentin 625 Tablet',
                  schedule: 'H',
                  pharmacy_price: 215,
                  stock_quantity: 48,
                  is_visible: true,
                },
              ],
            },
            meta: { page: 1, limit: 20, total: 1, has_next: false },
          }),
        });
      },
    );
    await page.goto('/catalogue/mapping');
    await expect(page.getByTestId('mapping-row-map-1')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Map a medicine' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Delete mapping' }),
    ).toHaveCount(0);
    await expect(
      page.getByText(/Only the owner can create or delete/),
    ).toBeVisible();
  });

  test('owner confirms mapping delete', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route(
      '**/api/v1/pharmacy/catalogue-mapping**',
      async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { mapping_id: 'map-1', deleted: true },
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
              pharmacy_id: PHARMACY_ID,
              mappings: [
                {
                  mapping_id: 'map-1',
                  master_medicine_id: 'med-aug',
                  name: 'Augmentin 625 Tablet',
                  schedule: 'H',
                  pharmacy_price: 215,
                  stock_quantity: 48,
                  is_visible: true,
                },
              ],
            },
            meta: { page: 1, limit: 20, total: 1, has_next: false },
          }),
        });
      },
    );
    await page.goto('/catalogue/mapping');
    await expect(page.getByTestId('mapping-row-map-1')).toBeVisible();
    await page.getByRole('button', { name: 'Delete mapping' }).click();
    await expect(page.getByTestId('mapping-delete-dialog')).toBeVisible();
    await page
      .getByTestId('mapping-delete-dialog')
      .getByRole('button', { name: 'Delete mapping' })
      .click();
    await expect(page.getByTestId('toast')).toHaveText('Mapping removed');
  });
});
