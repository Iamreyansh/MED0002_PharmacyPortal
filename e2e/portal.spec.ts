import { expect, test } from '@playwright/test';

test('home page renders host shell', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Pharmacy Portal' }),
  ).toBeVisible();
  await expect(page.getByTestId('configured-remotes')).toContainText('todo');
});

test('todos route mounts remote loader', async ({ page }) => {
  await page.goto('/todos');
  await expect(page.getByRole('heading', { name: 'Todos' })).toBeVisible();
  // Either the remote loads, or graceful degradation keeps the host alive.
  await expect(
    page
      .getByTestId('todo-mfe')
      .or(page.getByTestId('remote-error'))
      .or(page.getByTestId('remote-missing'))
      .or(page.getByText('Loading micro-frontend')),
  ).toBeVisible({ timeout: 15000 });
});
