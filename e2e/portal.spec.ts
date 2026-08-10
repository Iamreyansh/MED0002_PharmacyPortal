import { expect, test } from '@playwright/test';

test('home page renders host shell', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Pharmacy Portal' }),
  ).toBeVisible();
  await expect(page.getByTestId('configured-remotes')).toContainText('todo');
});

test('todos route mounts todo remote', async ({ page }) => {
  await page.goto('/todos');
  await expect(page.getByRole('heading', { name: 'Todos' })).toBeVisible();

  // Fail fast on graceful-degradation markers — e2e requires a live remote.
  await expect(page.getByTestId('remote-error')).toHaveCount(0);
  await expect(page.getByTestId('remote-missing')).toHaveCount(0);

  await expect(page.getByTestId('todo-mfe')).toBeVisible({ timeout: 30000 });
});
