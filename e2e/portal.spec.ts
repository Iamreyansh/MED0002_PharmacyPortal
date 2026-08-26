import { expect, test } from '@playwright/test';

test('home page renders pharmacy chrome without Todo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('portal-home')).toBeVisible();
  await expect(page.getByTestId('portal-nav')).toBeVisible();
  await expect(page.locator('a[href="/todos"]')).toHaveCount(0);
});

test('locked Khata on Free fixture', async ({ page }) => {
  await page.goto('/');
  const khataLock = page.getByTestId('plan-lock').filter({ hasText: 'Khata' });
  await expect(khataLock.first()).toBeVisible();
  await expect(khataLock.first()).not.toHaveAttribute('href', '/khata');
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
  await page.goto('/pos');
  await expect(page.getByTestId('portal-nav')).toBeVisible();
  await expect(page.getByTestId('remote-missing')).toBeVisible();
});
