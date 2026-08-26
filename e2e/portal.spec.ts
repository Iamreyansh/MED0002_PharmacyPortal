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

test('missing remote does not hide nav', async ({ page }) => {
  await page.goto('/pos');
  await expect(page.getByTestId('portal-nav')).toBeVisible();
  await expect(page.getByTestId('remote-missing')).toBeVisible();
});
