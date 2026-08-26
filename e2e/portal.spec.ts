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
});

test('login happy path against mock', async ({ page }) => {
  await page.route('**/api/v1/auth/pharmacy/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: loginData }),
    });
  });
  await mockCore(page);
  await page.goto('/login');
  await page.getByLabel('Email or mobile').fill('priya@srirama.in');
  await page.getByLabel('Password').fill('Secret123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByTestId('portal-home')).toBeVisible();
  await expect(page.getByTestId('session-menu')).toHaveText('Priya Sharma');
});

test('me bootstrap hydrates the header', async ({ page }) => {
  await mockCore(page);
  await seedSession(page);
  await page.goto('/');
  await expect(page.getByTestId('session-menu')).toHaveText('Priya Sharma');
  await expect(page.getByTestId('pharmacy-name')).toHaveText('Sri Rama Medicals');
});

test('revoke confirm dialog', async ({ page }) => {
  await mockCore(page);
  await seedSession(page);
  await page.route('**/api/v1/auth/sessions**', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { session_id: 's1', message: 'Session revoked.' },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            session_id: 's1',
            ip_address: '1.1.1.1',
            user_agent: 'Chrome',
            last_active_at: '2026-08-26T12:00:00.000Z',
          },
        ],
        meta: { page: 1, limit: 20, total: 1, has_next: false },
      }),
    });
  });
  await page.goto('/sessions');
  await page.getByRole('button', { name: 'Revoke' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
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
  await page.getByRole('option', { name: 'Rama Pharmacy - Koramangala' }).click();
  await expect(page.getByTestId('toast')).toContainText('FORBIDDEN');
  await expect(page.getByTestId('pharmacy-name')).toHaveText('Sri Rama Medicals');
});

test('PIN login mock', async ({ page }) => {
  await page.route('**/api/v1/auth/pharmacy/pos-pin', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          access_token: 'pos-access',
          token_type: 'Bearer',
          token_scope: 'pos',
          access_token_expires_in: 14400,
          staff: { id: STAFF_ID, name: 'Kavya Nair', role: 'cashier' },
          pharmacy: { id: PHARMACY_ID, name: 'Sri Rama Medicals' },
        },
      }),
    });
  });
  await page.goto('/pos-login');
  await page.getByLabel('Pharmacy ID').fill(PHARMACY_ID);
  await page.getByLabel('Staff ID').fill(STAFF_ID);
  await page.getByRole('button', { name: '1' }).click();
  await page.getByRole('button', { name: '2' }).click();
  await page.getByRole('button', { name: '3' }).click();
  await page.getByRole('button', { name: '4' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/pos$/);
  await expect(page.getByTestId('remote-page-pos')).toBeVisible();
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
  await expect(page.getByTestId('remote-page-onboarding')).toBeVisible();
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
  await expect(page.getByTestId('login-page')).toBeVisible();
});

test('missing remote does not hide nav', async ({ page }) => {
  await mockCore(page);
  await seedSession(page);
  await page.goto('/pos');
  await expect(page.getByTestId('portal-nav')).toBeVisible();
  await expect(page.getByTestId('remote-missing')).toBeVisible();
});
