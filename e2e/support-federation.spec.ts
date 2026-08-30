import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasSupportRemote = fs.existsSync(`${DIST_ROOT}/support/mf-manifest.json`);

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const TICKET_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

async function seedSession(page: Page) {
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

test.describe('support federation', () => {
  test.skip(!hasSupportRemote, 'support remote dist is not built');

  test('creates a ticket then opens detail without a list GET', async ({
    page,
  }) => {
    await seedSession(page);
    const listed: string[] = [];
    await page.route('**/api/v1/support/tickets', async (route) => {
      if (route.request().method() === 'GET') {
        listed.push(route.request().url());
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: TICKET_ID, subject: 'POS printer offline' },
        }),
      });
    });
    await page.route(
      `**/api/v1/support/tickets/${TICKET_ID}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: TICKET_ID,
              subject: 'POS printer offline',
              description: 'Counter 1 cannot print.',
              status: 'OPEN',
              replies: [],
            },
          }),
        });
      },
    );
    await page.goto('/support/new');
    await expect(page.getByLabel('Subject')).toBeVisible();
    await page.getByLabel('Subject').fill('POS printer offline');
    await page.getByRole('button', { name: 'Create ticket' }).click();
    await expect(page).toHaveURL(new RegExp(`/support/tickets/${TICKET_ID}`));
    await expect(page.getByTestId('ticket-description')).toBeVisible();
    expect(listed).toEqual([]);
  });

  test('hides escalate on ticket detail', async ({ page }) => {
    await seedSession(page);
    await page.route(
      `**/api/v1/support/tickets/${TICKET_ID}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: TICKET_ID,
              subject: 'POS printer offline',
              description: 'Counter 1 cannot print.',
              status: 'OPEN',
              replies: [{ body: 'Checking the driver.' }],
            },
          }),
        });
      },
    );
    await page.goto(`/support/tickets/${TICKET_ID}`);
    await expect(page.getByTestId('ticket-replies')).toBeVisible();
    await expect(page.getByRole('button', { name: /escalate/i })).toHaveCount(
      0,
    );
  });

  test('anonymous visitors browse help then open an article', async ({
    page,
  }) => {
    await page.route('**/api/v1/support/help', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { articles: [{ id: 'hours', title: 'Store opening hours' }] },
        }),
      });
    });
    await page.route('**/api/v1/support/help/articles/hours', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'hours',
            title: 'Store opening hours',
            body: 'Update hours from Settings.',
          },
        }),
      });
    });
    await page.goto('/help');
    await expect(page.getByTestId('help-catalogue')).toBeVisible();
    await expect(page.getByTestId('login-page')).toHaveCount(0);
    await page.getByRole('button', { name: 'Store opening hours' }).click();
    await expect(page).toHaveURL(/\/help\/articles\/hours/);
    await expect(page.getByTestId('help-article-body')).toBeVisible();
  });

  test('unknown article offers a link back to help', async ({ page }) => {
    await page.route(
      '**/api/v1/support/help/articles/missing',
      async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'HELP_ARTICLE_NOT_FOUND', message: 'Missing' },
          }),
        });
      },
    );
    await page.goto('/help/articles/missing');
    await expect(page.getByTestId('help-article-not-found')).toBeVisible();
    await page.getByRole('button', { name: 'Back to help' }).click();
    await expect(page).toHaveURL(/\/help$/);
  });
});
