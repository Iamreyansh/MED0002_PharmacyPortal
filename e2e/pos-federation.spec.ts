import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasPosRemote = fs.existsSync(`${DIST_ROOT}/pos/mf-manifest.json`);

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

type TokenScope = 'full' | 'pos';

type CartState = {
  cart_id: string;
  status: 'OPEN';
  customer: { name: string; phone: string } | null;
  items: Array<{
    item_id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    line_total: number;
  }>;
  rx_items_present: false;
  subtotal: number;
  gst_total: number;
  discount_amount: number;
  grand_total: number;
  expires_at: string;
};

function emptyCart(cartId: string): CartState {
  return {
    cart_id: cartId,
    status: 'OPEN',
    customer: null,
    items: [],
    rx_items_present: false,
    subtotal: 0,
    gst_total: 0,
    discount_amount: 0,
    grand_total: 0,
    expires_at: '2099-01-01T00:00:00Z',
  };
}

async function seedSession(page: Page, tokenScope: TokenScope = 'full') {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: STAFF_ID,
          name: 'Priya Sharma',
          role: 'pharmacy_staff',
          permissions: tokenScope === 'pos' ? ['pos:sell'] : ['*'],
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
        accessToken: tokenScope === 'pos' ? 'pos-access' : 'access',
        refreshToken: tokenScope === 'pos' ? null : 'refresh',
        tokenType: 'Bearer',
        tokenScope,
        accessTokenExpiresAt: Date.now() + 60_000,
      }),
      snapshot: JSON.stringify({
        pharmacies: [],
        staffId: STAFF_ID,
        staffName: 'Priya Sharma',
        pharmacyId: PHARMACY_ID,
        pharmacyName: 'Sri Rama Medicals',
        role: 'pharmacy_staff',
        plan: 'FREE',
        pharmacyStatus: 'ACTIVE',
        permissions: tokenScope === 'pos' ? ['pos:sell'] : ['*'],
        tokenScope,
      }),
    },
  );
}

async function mockPosApi(page: Page, options?: { failCheckout?: boolean }) {
  let cart = emptyCart('cart-1');
  let nextCart = 2;
  let nextItem = 1;

  await page.route('**/api/v1/pharmacy/pos/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    const json = async () => {
      try {
        return (await request.postDataJSON()) as Record<string, unknown>;
      } catch {
        return {};
      }
    };

    const fulfill = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data }),
      });

    const fail = (code: string, message: string, status = 400) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code, message },
        }),
      });

    if (method === 'POST' && path.endsWith('/pharmacy/pos/cart')) {
      cart = emptyCart(`cart-${nextCart++}`);
      return fulfill(cart, 201);
    }

    if (method === 'GET' && /\/cart\/[^/]+$/.test(path)) {
      return fulfill(cart);
    }

    if (method === 'DELETE' && /\/cart\/[^/]+$/.test(path)) {
      return fulfill({ items_removed: cart.items.length });
    }

    if (method === 'POST' && path.endsWith('/search')) {
      const body = await json();
      return fulfill({
        results: [
          {
            product_id: 'prod-1',
            name: 'Crocin 500mg Tablet',
            mrp: 24,
            auto_add: body.mode === 'BARCODE',
          },
        ],
        mode: body.mode ?? 'TEXT',
      });
    }

    if (method === 'POST' && path.endsWith('/items')) {
      const item = {
        item_id: `item-${nextItem++}`,
        product_id: 'prod-1',
        product_name: 'Crocin 500mg Tablet',
        quantity: 1,
        line_total: 24,
      };
      cart = {
        ...cart,
        items: [...cart.items, item],
        subtotal: 24,
        grand_total: 24,
      };
      return fulfill({
        ...item,
        cart_grand_total: 24,
      });
    }

    if (method === 'POST' && path.endsWith('/customer')) {
      const body = await json();
      cart = {
        ...cart,
        customer: {
          name: String(body.customer_name ?? 'Anita'),
          phone: String(body.customer_phone ?? '9999999999'),
        },
      };
      return fulfill({
        customer_id: 'cust-1',
        name: cart.customer.name,
        phone: cart.customer.phone,
      });
    }

    if (method === 'POST' && path.endsWith('/discount')) {
      cart = { ...cart, discount_amount: 4, grand_total: 20 };
      return fulfill({ discount_type: 'FLAT_RS', grand_total: 20 });
    }

    if (method === 'POST' && path.endsWith('/checkout')) {
      if (options?.failCheckout) {
        return fail(
          'INSUFFICIENT_STOCK',
          'Requested quantity exceeds batch stock.',
        );
      }
      return fulfill({
        invoice_id: 'inv-1',
        invoice_number: 'INV-1',
        payment_method: 'CASH',
        amount_paid: 24,
        change_due: 0,
        grand_total: 24,
        items_count: cart.items.length,
        customer_name: cart.customer?.name,
        completed_at: '2026-08-30T00:00:00Z',
      });
    }

    return fail('VALIDATION_ERROR', 'Unhandled POS path');
  });
}

test.describe('POS federation', () => {
  test.skip(!hasPosRemote, 'pos remote dist is not built');

  test('clears a lined cart after confirm', async ({ page }) => {
    await seedSession(page);
    await mockPosApi(page);
    await page.goto('/pos');
    await expect(page.getByTestId('pos-page')).toBeVisible();
    await page
      .getByRole('combobox', { name: 'Search products' })
      .fill('crocin');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByTestId('pos-cart-table')).toBeVisible();
    await page.getByRole('button', { name: 'Clear cart' }).click();
    await expect(page.getByTestId('pos-clear-dialog')).toBeVisible();
    await page
      .getByTestId('pos-clear-dialog')
      .getByRole('button', { name: 'Clear cart' })
      .click();
    await expect(page.getByTestId('pos-cart-empty')).toBeVisible();
  });

  test('attaches a customer and keeps stock failure off the receipt', async ({
    page,
  }) => {
    await seedSession(page);
    await mockPosApi(page, { failCheckout: true });
    await page.goto('/pos');
    await page.getByLabel('Customer phone').fill('9999999999');
    await page.getByLabel('Customer name').fill('Anita');
    await page.getByRole('button', { name: 'Attach customer' }).click();
    await expect(page.getByTestId('pos-customer')).toContainText('Anita');
    await page
      .getByRole('combobox', { name: 'Search products' })
      .fill('crocin');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page.getByTestId('pos-error')).toContainText('exceeds batch');
    await expect(page.getByTestId('pos-receipt')).toHaveCount(0);
  });

  test('tabs from search to cart to pay', async ({ page }) => {
    await seedSession(page);
    await mockPosApi(page);
    await page.goto('/pos');
    await page
      .getByRole('combobox', { name: 'Search products' })
      .fill('crocin');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByTestId('pos-cart-table')).toBeVisible();
    await expect(page.getByTestId('pos-checkout')).toBeVisible();
    const search = page.getByRole('combobox', { name: 'Search products' });
    const searchBeforeCart = await search.evaluate((el) => {
      const cart = document.querySelector('[data-testid="pos-cart-table"]');
      return (
        !!cart &&
        (el.compareDocumentPosition(cart) &
          Node.DOCUMENT_POSITION_FOLLOWING) !==
          0
      );
    });
    const cartBeforePay = await page
      .getByTestId('pos-cart-table')
      .evaluate((el) => {
        const pay = document.querySelector('[data-testid="pos-checkout"]');
        return (
          !!pay &&
          (el.compareDocumentPosition(pay) &
            Node.DOCUMENT_POSITION_FOLLOWING) !==
            0
        );
      });
    expect(searchBeforeCart).toBe(true);
    expect(cartBeforePay).toBe(true);
  });

  test('blocks checkout while offline', async ({ page, context }) => {
    await seedSession(page);
    await mockPosApi(page);
    await page.goto('/pos');
    await page
      .getByRole('combobox', { name: 'Search products' })
      .fill('crocin');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByTestId('pos-checkout')).toBeVisible();
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page.getByTestId('pos-error')).toBeVisible();
    await expect(page.getByTestId('pos-receipt')).toHaveCount(0);
  });

  test('axe on POS has no critical', async ({ page }) => {
    await seedSession(page);
    await mockPosApi(page);
    await page.goto('/pos');
    await expect(page.getByTestId('pos-page')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === 'critical',
    );
    expect(blocking).toEqual([]);
  });

  test('covers pos-checkout on a cash sale', async ({ page }) => {
    await seedSession(page);
    await mockPosApi(page);
    await page.goto('/pos');
    await expect(page.getByTestId('pos-page')).toBeVisible();
    await page
      .getByRole('combobox', { name: 'Search products' })
      .fill('crocin');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByTestId('pos-checkout')).toBeVisible();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page.getByTestId('pos-receipt')).toBeVisible();
  });

  test('PIN sale never calls settings or inventory', async ({ page }) => {
    const urls: string[] = [];
    page.on('request', (request) => {
      urls.push(request.url());
    });
    await seedSession(page, 'pos');
    await mockPosApi(page);
    await page.goto('/pos');
    await page
      .getByRole('combobox', { name: 'Search products' })
      .fill('crocin');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page.getByTestId('pos-receipt')).toBeVisible();
    await expect(page.getByTestId('pos-pdf-deferred')).toBeVisible();
    expect(
      urls.some(
        (url) =>
          url.includes('/api/v1/pharmacy/settings') ||
          url.includes('/api/v1/pharmacy/inventory'),
      ),
    ).toBe(false);
    expect(page.url()).not.toContain('9999999999');
  });
});
