import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

async function mockCore(page: Page) {
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: STAFF_ID,
          name: 'Priya Sharma',
          role: 'pharmacy_owner',
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
        data: { pharmacy_id: PHARMACY_ID, status: 'ACTIVE', plan: 'FREE' },
      }),
    });
  });
  await page.route('**/api/v1/pharmacy/dashboard/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          orders: {
            pending_acceptance: 0,
            accepted: 0,
            packing: 0,
            ready_for_pickup: 0,
            out_for_delivery: 0,
          },
        },
      }),
    });
  });
}

async function seedSession(page: Page) {
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
        role: 'pharmacy_owner',
        plan: 'FREE',
        pharmacyStatus: 'ACTIVE',
        permissions: ['*'],
        tokenScope: 'full',
      }),
    },
  );
}

function isOrdersListGet(url: string, method: string): boolean {
  if (method !== 'GET') {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.pathname === '/api/v1/pharmacy/orders';
  } catch {
    return false;
  }
}

test('journeys never GET the pharmacy orders list', async ({ page }) => {
  const listGets: string[] = [];
  page.on('request', (request) => {
    if (isOrdersListGet(request.url(), request.method())) {
      listGets.push(request.url());
    }
  });
  await mockCore(page);
  await seedSession(page);
  await page.goto('/');
  await expect(page.getByTestId('portal-home')).toBeVisible();
  await expect(page.getByTestId('portal-nav')).toBeVisible();
  await page.goto('/orders');
  await expect(page.getByTestId('orders-orders-home-page')).toBeVisible();
  await page.goto('/orders/not-a-uuid');
  await expect(page.getByTestId('not-found')).toBeVisible();
  await page.goto('/rx-quotes');
  await expect(page.getByTestId('orders-rx-quotes-page')).toBeVisible();
  expect(listGets).toEqual([]);
});

test('tokens stay in sessionStorage and off localStorage', async ({ page }) => {
  await mockCore(page);
  await seedSession(page);
  await page.goto('/');
  await expect(page.getByTestId('portal-home')).toBeVisible();
  const storage = await page.evaluate(() => ({
    localKeys: Object.keys(localStorage),
    hasSessionTokens: Boolean(sessionStorage.getItem('medmate.portal.tokens')),
  }));
  expect(storage.hasSessionTokens).toBe(true);
  expect(
    storage.localKeys.some((key) => /token|refresh|access/i.test(key)),
  ).toBe(false);
});

test('reduced motion collapses animation duration', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockCore(page);
  await seedSession(page);
  await page.goto('/');
  await expect(page.getByTestId('portal-home')).toBeVisible();
  const durationMs = await page.locator('body').evaluate((el) => {
    const raw = getComputedStyle(el).animationDuration;
    const first = raw.split(',')[0]?.trim() ?? '0s';
    if (first.endsWith('ms')) {
      return Number.parseFloat(first);
    }
    return Number.parseFloat(first) * 1000;
  });
  expect(durationMs).toBeLessThan(20);
});

test('axe on logged-in home has no serious or critical', async ({ page }) => {
  await mockCore(page);
  await seedSession(page);
  await page.goto('/');
  await expect(page.getByTestId('portal-home')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) =>
      violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blocking).toEqual([]);
});
