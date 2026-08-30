import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasOrdersRemote = fs.existsSync(`${DIST_ROOT}/orders/mf-manifest.json`);

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const ORDER_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const RIDER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

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

test.describe('orders federation', () => {
  test.skip(!hasOrdersRemote, 'orders remote dist is not built');

  test('expired quotes stay read-only', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route('**/api/v1/pharmacy/rx-quotes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            quotes: [
              {
                quote_id: 'q-1',
                status: 'NOTIFIED',
                created_at: '2026-08-30',
              },
              {
                quote_id: 'q-expired',
                status: 'EXPIRED',
                created_at: '2026-08-29',
              },
            ],
          },
        }),
      });
    });
    await page.goto('/rx-quotes');
    await expect(page.getByTestId('orders-quotes-table')).toBeVisible();
    await expect(
      page.getByTestId('orders-quote-readonly-q-expired'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Quote' })).toHaveCount(1);
  });

  test('accepts and rejects an order by id', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    await page.route(
      `**/api/v1/pharmacy/orders/${ORDER_ID}/**`,
      async (route) => {
        const url = route.request().url();
        if (url.includes('/accept')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { order_id: ORDER_ID, status: 'ACCEPTED' },
            }),
          });
          return;
        }
        if (url.includes('/reject')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { order_id: ORDER_ID, status: 'REJECTED' },
            }),
          });
          return;
        }
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'INVALID_STATUS_TRANSITION', message: 'Illegal' },
          }),
        });
      },
    );
    const listGets: string[] = [];
    page.on('request', (request) => {
      if (
        request.method() === 'GET' &&
        request.url().includes('/pharmacy/orders')
      ) {
        listGets.push(request.url());
      }
    });
    await page.goto(`/orders/${ORDER_ID}`);
    await expect(page.getByTestId('orders-order-id')).toHaveText(ORDER_ID);
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    await expect(page.getByText('Order accepted')).toBeVisible();
    await page.getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByLabel('Rejection reason')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm reject' }).click();
    await expect(page.getByTestId('orders-reject-refund')).toBeVisible();
    await page.getByRole('button', { name: 'CONFIRMED' }).click();
    await expect(page.getByTestId('orders-actions-error')).toBeVisible();
    expect(listGets).toEqual([]);
  });

  test('assigns a rider without listing riders', async ({ page }) => {
    await seedSession(page, 'pharmacy_staff');
    const riderGets: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/riders')) {
        riderGets.push(request.url());
      }
    });
    await page.route(
      `**/api/v1/pharmacy/orders/${ORDER_ID}/assign-rider`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { order_id: ORDER_ID, rider_id: RIDER_ID },
          }),
        });
      },
    );
    await page.goto(`/orders/${ORDER_ID}`);
    await page.getByLabel('Rider id').fill(RIDER_ID);
    await page.getByRole('button', { name: 'Assign rider' }).click();
    await expect(page.getByText('Rider assigned')).toBeVisible();
    expect(riderGets).toEqual([]);
  });

  test('accept 404 keeps the id-in-hand screen without a list GET', async ({
    page,
  }) => {
    const listGets: string[] = [];
    page.on('request', (request) => {
      if (
        request.method() === 'GET' &&
        /\/api\/v1\/pharmacy\/orders\/?$/.test(new URL(request.url()).pathname)
      ) {
        listGets.push(request.url());
      }
    });
    await seedSession(page, 'pharmacy_owner');
    await page.route(
      `**/api/v1/pharmacy/orders/${ORDER_ID}/accept`,
      async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: 'This order was not found.',
            },
          }),
        });
      },
    );
    await page.goto(`/orders/${ORDER_ID}`);
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    await expect(
      page
        .getByTestId('not-found')
        .or(page.getByTestId('orders-actions-error')),
    ).toBeVisible();
    expect(listGets).toEqual([]);
  });

  test('shows guidance on /orders without a list', async ({ page }) => {
    await seedSession(page, 'pharmacy_owner');
    const listGets: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/pharmacy/orders')) {
        listGets.push(request.url());
      }
    });
    await page.goto('/orders');
    await expect(page.getByTestId('orders-home-guidance')).toBeVisible();
    expect(listGets).toEqual([]);
  });
});
