import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasProcurementRemote = fs.existsSync(
  `${DIST_ROOT}/procurement/mf-manifest.json`,
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

test.describe('procurement federation', () => {
  test.skip(!hasProcurementRemote, 'procurement remote dist is not built');

  test('owner adds a GRN line then stocks', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route('**/api/v1/pharmacy/purchases/grn-1**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            grn_id: 'grn-1',
            invoice_number: 'INV-1',
            status: 'DRAFT',
            items: [
              {
                item_id: 'item-1',
                product_id: 'prod-1',
                product_name: 'Crocin 500mg Tablet',
                quantity: 10,
              },
            ],
            totals: { grand_total: 291.2 },
          },
        }),
      });
    });
    await page.route(
      '**/api/v1/pharmacy/purchases/grn-1/items**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { item_id: 'item-2', quantity: 5 },
          }),
        });
      },
    );
    await page.route(
      '**/api/v1/pharmacy/purchases/grn-1/save-and-stock**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { grn_id: 'grn-1', status: 'STOCKED' },
          }),
        });
      },
    );
    await page.goto('/purchases/grn-1');
    await expect(page.getByTestId('grn-items')).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Product' }),
    ).toBeVisible();
    await page.getByLabel('Product id').fill('prod-2');
    await page.getByLabel('Paid quantity').fill('5');
    await page.getByRole('button', { name: 'Add line' }).click();
    await expect(
      page.getByRole('button', { name: 'Save and stock' }),
    ).toBeVisible();
  });

  test('rejects a CSV preview without a file', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route('**/api/v1/pharmacy/purchases**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            kpi: { total_grns: 0 },
            grns: [],
          },
        }),
      });
    });
    await page.goto('/purchases');
    await page.getByRole('button', { name: 'Import CSV' }).click();
    await expect(page.getByLabel('Invoice CSV')).toBeVisible();
    await page.getByRole('button', { name: 'Upload preview' }).click();
    await expect(page.getByTestId('csv-error')).toContainText('CSV file');
  });

  test('Growth owner creates a distributor', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner', 'RETAIL_PRO');
    await page.route('**/api/v1/pharmacy/distributors**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'd2', firm_name: 'New Firm' },
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
            kpi: { distributor_count: 1 },
            distributors: [{ id: 'd1', firm_name: 'Medico Pharma' }],
          },
        }),
      });
    });
    await page.goto('/distributors');
    await expect(page.getByTestId('distributors-table')).toBeVisible();
    await page.getByLabel('Firm name').fill('New Firm');
    await page.getByRole('button', { name: 'Add distributor' }).click();
    await expect(page.getByTestId('toast')).toHaveText('Distributor added');
  });

  test('Growth owner confirms send PO', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner', 'RETAIL_PRO');
    // Playwright uses the last matching route. Register generic first.
    await page.route('**/api/v1/pharmacy/reorder**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            kpi: { items_below_reorder_level: 1 },
            suggestion_groups: [],
          },
        }),
      });
    });
    await page.route(
      '**/api/v1/pharmacy/reorder/purchase-orders**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              purchase_orders: [
                {
                  po_id: 'po-1',
                  po_number: 'PO-1',
                  status: 'DRAFT',
                  estimated_total: 100,
                },
              ],
            },
          }),
        });
      },
    );
    await page.route(
      '**/api/v1/pharmacy/reorder/purchase-orders/**/send',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { po_id: 'po-1', status: 'SENT' },
          }),
        });
      },
    );
    await page.goto('/reorder');
    await expect(page.getByTestId('po-table')).toBeVisible();
    await page.getByRole('button', { name: 'Send PO' }).click();
    await expect(page.getByTestId('send-po-dialog')).toBeVisible();
    await page
      .getByTestId('send-po-dialog')
      .getByRole('button', { name: 'Send PO' })
      .click();
    await expect(page.getByTestId('toast')).toHaveText('Purchase order sent');
  });

  test('Free owner sees a Growth lock on distributors', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner', 'FREE');
    await page.goto('/distributors');
    await expect(page.getByTestId('distributors-plan-lock')).toBeVisible();
    await expect(page.getByTestId('distributors-plan-lock')).toContainText(
      'Growth',
    );
  });
});
