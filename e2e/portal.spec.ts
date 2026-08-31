import { expect, test, type Page } from '@playwright/test';

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const loginData = {
  access_token: 'access',
  refresh_token: 'refresh',
  token_type: 'Bearer',
  access_token_expires_in: 900,
  active_pharmacy: {
    id: PHARMACY_ID,
    name: 'Sri Rama Medicals',
    subscription_plan: 'FREE',
  },
  staff: {
    id: STAFF_ID,
    name: 'Priya Sharma',
    role: 'pharmacy_owner',
  },
  pharmacies: [
    {
      id: PHARMACY_ID,
      name: 'Sri Rama Medicals',
      role: 'pharmacy_owner',
      is_active: true,
    },
    {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      name: 'Rama Pharmacy - Koramangala',
      role: 'pharmacy_staff',
      is_active: true,
    },
  ],
};

async function mockCore(page: Page, options?: { status?: string }) {
  const status = options?.status ?? 'ACTIVE';
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
        data: { pharmacy_id: PHARMACY_ID, status, plan: 'FREE' },
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
        pharmacies: loginData.pharmacies.map((row) => ({
          id: row.id,
          name: row.name,
          role: row.role,
          isActive: row.is_active,
        })),
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

test('home page renders pharmacy chrome without Todo', async ({ page }) => {
  await mockCore(page);
  await seedSession(page);
  await page.goto('/');
  await expect(page.getByTestId('portal-home')).toBeVisible();
  await expect(page.getByTestId('portal-nav')).toBeVisible();
  await expect(page.locator('a[href="/todos"]')).toHaveCount(0);
});

test('locked Khata on Free fixture', async ({ page }) => {
  await mockCore(page);
  await seedSession(page);
  await page.goto('/');
  const khataLock = page.getByTestId('plan-lock').filter({ hasText: 'Khata' });
  await expect(khataLock.first()).toBeVisible();
  await expect(khataLock.first()).not.toHaveAttribute('href', '/khata');
  await expect(page.getByText(/Khata needs Starter/).first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Upgrade' }).first(),
  ).toHaveAttribute('href', '/subscription');
});

test('staff fixture has no Upgrade on locked Khata', async ({ page }) => {
  await mockCore(page);
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
        role: 'pharmacy_staff',
        plan: 'FREE',
        pharmacyStatus: 'ACTIVE',
        permissions: ['*'],
        tokenScope: 'full',
      }),
    },
  );
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
          permissions: ['*'],
          active_pharmacy: { id: PHARMACY_ID, name: 'Sri Rama Medicals' },
        },
      }),
    });
  });
  await page.goto('/');
  const khataLock = page.getByTestId('plan-lock').filter({ hasText: 'Khata' });
  await expect(khataLock.first()).toBeVisible();
  await expect(
    page.getByText(/Khata needs Starter\. Ask the pharmacy owner/).first(),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Upgrade' })).toHaveCount(0);
});

test('me bootstrap hydrates the header', async ({ page }) => {
  await mockCore(page);
  await seedSession(page);
  await page.goto('/');
  await expect(page.getByTestId('session-menu')).toHaveText('Priya Sharma');
  await expect(page.getByTestId('pharmacy-name')).toHaveText(
    'Sri Rama Medicals',
  );
});

test('switch forbidden keeps pharmacy context', async ({ page }) => {
  await mockCore(page);
  await seedSession(page);
  await page.route('**/api/v1/auth/pharmacy/switch-pharmacy', async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not assigned' },
      }),
    });
  });
  await page.goto('/');
  await page.getByTestId('pharmacy-switcher').click();
  await page
    .getByRole('option', { name: 'Rama Pharmacy - Koramangala' })
    .click();
  await expect(page.getByTestId('toast')).toContainText('FORBIDDEN');
  await expect(page.getByTestId('pharmacy-name')).toHaveText(
    'Sri Rama Medicals',
  );
});

test('KYC pharmacy cannot open quotes', async ({ page }) => {
  await mockCore(page, { status: 'PENDING_KYC' });
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
        pharmacyStatus: 'PENDING_KYC',
        permissions: ['*'],
        tokenScope: 'full',
      }),
    },
  );
  await page.goto('/rx-quotes');
  await expect(
    page.locator('section[data-testid="onboarding-status-page"]'),
  ).toBeVisible();
});

test('expired session lands on login', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'medmate.portal.tokens',
      JSON.stringify({
        accessToken: 'expired-access',
        refreshToken: 'expired-refresh',
        tokenType: 'Bearer',
        tokenScope: 'full',
        accessTokenExpiresAt: 0,
      }),
    );
  });
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      }),
    });
  });
  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: { code: 'REFRESH_TOKEN_EXPIRED', message: 'Expired' },
      }),
    });
  });
  await page.goto('/');
  await expect(page.locator('section[data-testid="login-page"]')).toBeVisible();
});

test('sign out deletes the device token', async ({ page }) => {
  const deleted: string[] = [];
  await mockCore(page);
  await seedSession(page);
  await page.route('**/api/v1/pharmacy/me/device-token', async (route) => {
    if (route.request().method() === 'DELETE') {
      deleted.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { unregistered: true },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { registered: true, device_id: 'dev-1', platform: 'ANDROID' },
      }),
    });
  });
  await page.route('**/api/v1/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    });
  });
  await page.goto('/');
  await expect(page.getByTestId('portal-home')).toBeVisible();
  await page.getByTestId('session-menu').click();
  await page.getByRole('menuitem', { name: 'Sign out', exact: true }).click();
  await expect(page.locator('section[data-testid="login-page"]')).toBeVisible();
  expect(deleted.length).toBeGreaterThan(0);
});

test('missing remote does not hide nav', async ({ page }) => {
  await mockCore(page);
  await seedSession(page);
  await page.goto('/pos');
  await expect(page.getByTestId('portal-nav')).toBeVisible();
  await expect(page.getByTestId('remote-missing')).toBeVisible();
});
