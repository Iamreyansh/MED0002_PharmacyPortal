import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasBillingRemote = fs.existsSync(`${DIST_ROOT}/billing/mf-manifest.json`);

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

test.describe('billing federation', () => {
  test.skip(!hasBillingRemote, 'billing remote dist is not built');

  test('owner shares an invoice DTO', async ({ page }) => {
    const shareBodies: unknown[] = [];
    await seedSession(page, 'pharmacy_owner');
    await page.route('**/api/v1/pharmacy/invoices/inv-1**', async (route) => {
      if (route.request().url().includes('/share')) {
        shareBodies.push(route.request().postDataJSON());
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { channel: 'WHATSAPP', message_id: 'm1' },
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
            invoice_id: 'inv-1',
            invoice_number: 'INV-1',
            payment_status: 'PAID',
            grand_total: 291.2,
            customer: { name: 'Ravi' },
            line_items: [
              {
                product_name: 'Crocin 500mg Tablet',
                quantity: 2,
                line_total: 291.2,
              },
            ],
            gst_breakdown: [{ slab: '12%', taxable_amount: 247 }],
          },
        }),
      });
    });
    await page.goto('/invoices/inv-1');
    await expect(page.getByTestId('invoice-lines')).toBeVisible();
    await page.getByLabel('Phone or email').fill('+919999999999');
    await page.getByRole('button', { name: 'Share' }).click();
    await expect(page.getByTestId('invoice-shared')).toBeVisible();
    expect(shareBodies[0]).toEqual({
      channel: 'WHATSAPP',
      recipient_phone_or_email: '+919999999999',
    });
  });

  test('invoice settings never call e-invoice IRN', async ({ page }) => {
    const paths: string[] = [];
    await seedSession(page, 'pharmacy_owner');
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/')) {
        paths.push(new URL(request.url()).pathname);
      }
    });
    await page.route('**/api/v1/pharmacy/invoice-settings**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { invoice_prefix: 'INV', template: 'MODERN' },
        }),
      });
    });
    await page.goto('/invoice-settings');
    await expect(page.getByLabel('Invoice prefix')).toBeVisible();
    expect(paths.some((path) => path.includes('/integrations/einvoice'))).toBe(
      false,
    );
    expect(paths.some((path) => path.includes('irn'))).toBe(false);
  });

  test('opens sale detail from the ledger', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route('**/api/v1/pharmacy/sales/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { total_bills: 1, total_revenue: 291.2, avg_bill_value: 291.2 },
        }),
      });
    });
    await page.route('**/api/v1/pharmacy/sales/inv-1**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            invoice_id: 'inv-1',
            sale_id: 'inv-1',
            invoice_number: 'INV-1',
            grand_total: 291.2,
            payment_status: 'PENDING',
          },
        }),
      });
    });
    await page.route('**/api/v1/pharmacy/sales**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            sales: [
              {
                sale_id: 'inv-1',
                invoice_number: 'INV-1',
                payment_status: 'PENDING',
                grand_total: 291.2,
              },
            ],
          },
        }),
      });
    });
    await page.goto('/sales');
    await expect(page.getByTestId('sales-table')).toBeVisible();
    await page.getByRole('button', { name: 'Open' }).click();
    await expect(page.getByTestId('sale-detail')).toBeVisible();
  });

  test('hides mark-paid for staff and returns 403 if posted', async ({
    page,
  }) => {
    const markPaidCalls: string[] = [];
    await seedSession(page, 'pharmacy_staff');
    await page.route('**/api/v1/pharmacy/sales/*/mark-paid', async (route) => {
      markPaidCalls.push(route.request().url());
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'STAFF_CANNOT_MARK_PAID' },
        }),
      });
    });
    await page.route('**/api/v1/pharmacy/sales/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { total_bills: 1, total_revenue: 100, avg_bill_value: 100 },
        }),
      });
    });
    await page.route('**/api/v1/pharmacy/sales**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            sales: [
              {
                sale_id: 'inv-1',
                invoice_number: 'INV-1',
                payment_status: 'PENDING',
                grand_total: 100,
              },
            ],
          },
        }),
      });
    });
    await page.goto('/sales');
    await expect(page.getByTestId('sales-table')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark paid' })).toHaveCount(
      0,
    );
    expect(markPaidCalls).toEqual([]);
  });

  test('empty invoices offer a POS CTA', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route('**/api/v1/pharmacy/invoices**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { invoices: [] },
        }),
      });
    });
    await page.goto('/invoices');
    await expect(page.getByTestId('invoices-empty')).toBeVisible();
    await page.getByRole('button', { name: 'Open POS' }).click();
    await expect(page).toHaveURL(/\/pos/);
  });

  test('opens invoice detail from the list', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route('**/api/v1/pharmacy/invoices/inv-1**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            invoice_id: 'inv-1',
            invoice_number: 'INV-1',
            grand_total: 291.2,
            line_items: [{ product_name: 'Crocin', quantity: 1 }],
            gst_breakdown: [{ slab: '12%', taxable_amount: 247 }],
          },
        }),
      });
    });
    await page.route('**/api/v1/pharmacy/invoices**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            invoices: [
              {
                invoice_id: 'inv-1',
                invoice_number: 'INV-1',
                grand_total: 291.2,
                payment_status: 'PAID',
              },
            ],
          },
        }),
      });
    });
    await page.goto('/invoices');
    await expect(page.getByTestId('invoices-table')).toBeVisible();
    await page.getByRole('button', { name: 'Open' }).click();
    await expect(page).toHaveURL(/\/invoices\/inv-1/);
    await expect(page.getByTestId('invoice-lines')).toBeVisible();
  });

  test('owner mark-paid cancel does not POST; confirm posts once', async ({
    page,
  }) => {
    const markPaidBodies: unknown[] = [];
    await seedSession(page, 'pharmacy_owner');
    await page.route('**/api/v1/pharmacy/sales**', async (route) => {
      if (route.request().url().includes('mark-paid')) {
        markPaidBodies.push(route.request().postDataJSON());
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { sale_id: 'inv-1', new_payment_status: 'PAID' },
          }),
        });
        return;
      }
      if (route.request().url().includes('/summary')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { total_bills: 1, total_revenue: 100, avg_bill_value: 100 },
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
            sales: [
              {
                sale_id: 'inv-1',
                invoice_number: 'INV-1',
                payment_status: 'PENDING',
                grand_total: 100,
              },
            ],
          },
        }),
      });
    });
    await page.goto('/sales');
    await expect(page.getByTestId('sales-table')).toBeVisible();
    await page.getByRole('button', { name: 'Mark paid' }).click();
    await expect(page.getByTestId('mark-paid-dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    expect(markPaidBodies).toEqual([]);
    await page.getByRole('button', { name: 'Mark paid' }).click();
    await page.getByRole('button', { name: 'Confirm payment' }).click();
    await expect.poll(() => markPaidBodies.length).toBe(1);
    expect(markPaidBodies[0]).toMatchObject({
      payment_mode: 'CASH',
      amount: 100,
    });
  });

  test('dirty invoice settings prompt before leaving', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route('**/api/v1/pharmacy/invoice-settings**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { invoice_prefix: 'INV', template: 'MODERN' },
        }),
      });
    });
    await page.goto('/invoice-settings');
    await expect(page.getByLabel('Invoice prefix')).toBeVisible();
    await page.getByLabel('Invoice prefix').fill('GST');
    await page.getByRole('link', { name: 'Sales' }).first().click();
    await expect(
      page.getByRole('heading', { name: 'Leave without saving?' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Stay' }).click();
    await expect(page).toHaveURL(/\/invoice-settings/);
  });
});
