import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasRxRemote = fs.existsSync(`${DIST_ROOT}/rx/mf-manifest.json`);

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

async function seedSession(
  page: Page,
  role: 'pharmacy_owner' | 'pharmacy_staff',
  plan: 'FREE' | 'STARTER' = 'STARTER',
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

test.describe('rx federation', () => {
  test.skip(!hasRxRemote, 'rx remote dist is not built');

  test('owner opens prescription detail and approves', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner', 'STARTER');
    await page.route(
      '**/api/v1/pharmacy/prescriptions/rx-1**',
      async (route) => {
        if (route.request().url().includes('/approve')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { rx_id: 'rx-1', status: 'APPROVED' },
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
              rx_id: 'rx-1',
              status: 'PENDING_REVIEW',
              created_at: '2026-08-30',
              schedule_h1: true,
              lines: [
                {
                  line_id: 'l1',
                  product_name: 'Alprazolam 0.25mg',
                  quantity: 10,
                  schedule_h1: true,
                },
              ],
            },
          }),
        });
      },
    );
    await page.goto('/prescriptions/rx-1');
    await expect(page.getByTestId('rx-lines-table')).toBeVisible();
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText('Prescription approved')).toBeVisible();
  });

  test('maps insufficient stock on dispense', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner', 'STARTER');
    await page.route(
      '**/api/v1/pharmacy/prescriptions/rx-1**',
      async (route) => {
        if (route.request().url().includes('/dispense')) {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: { code: 'INSUFFICIENT_STOCK', message: 'Out of stock' },
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
              rx_id: 'rx-1',
              status: 'APPROVED',
              schedule_x: true,
              lines: [
                { product_name: 'Morphine', quantity: 2, schedule_x: true },
              ],
            },
          }),
        });
      },
    );
    await page.goto('/prescriptions/rx-1');
    await page.getByRole('button', { name: 'Dispense' }).click();
    await expect(page.getByTestId('rx-dispense-dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm dispense' }).click();
    await expect(page.getByTestId('rx-detail-error')).toContainText(/stock/i);
  });

  test('locks the queue on FREE', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner', 'FREE');
    await page.goto('/prescriptions');
    await expect(page.getByTestId('rx-queue-plan-lock')).toBeVisible();
  });

  test('filters the drug register on Free', async ({ page }) => {
    const queries: string[] = [];
    await seedSession(page, 'pharmacy_owner', 'FREE');
    await page.route(
      '**/api/v1/pharmacy/compliance/drug-register**',
      async (route) => {
        queries.push(new URL(route.request().url()).search);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              entries: [
                {
                  entry_id: 'reg-1',
                  dispensed_at: '2026-08-29',
                  product_name: 'Alprazolam 0.25mg',
                  schedule: 'H1',
                  quantity: 10,
                },
              ],
            },
          }),
        });
      },
    );
    await page.route(
      '**/api/v1/admin/compliance/drug-register/retention-rules**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { guidance: 'Keep H1/X register rows for two years.' },
          }),
        });
      },
    );
    await page.goto('/compliance/drug-register');
    await expect(page.getByTestId('rx-register-table')).toBeVisible();
    await page.getByLabel('Schedule').selectOption('H1');
    await expect
      .poll(() => queries.some((query) => query.includes('schedule=H1')))
      .toBe(true);
  });

  test('hides cashier mutate actions', async ({ page }) => {
    await seedSession(page, 'pharmacy_staff', 'STARTER');
    await page.route(
      '**/api/v1/pharmacy/prescriptions/rx-1**',
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              rx_id: 'rx-1',
              status: 'PENDING_REVIEW',
              lines: [{ product_name: 'Crocin', quantity: 1 }],
            },
          }),
        });
      },
    );
    await page.goto('/prescriptions/rx-1');
    await expect(page.getByTestId('rx-lines-table')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
  });
});
