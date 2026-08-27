import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasSettingsRemote = fs.existsSync(
  `${DIST_ROOT}/settings/mf-manifest.json`,
);

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const profile = {
  pharmacy_id: PHARMACY_ID,
  business_name: 'Sri Rama Medicals',
  tagline: 'Your neighbourhood pharmacy',
  phone: '+919876543210',
  email: 'priya@srirama.in',
  address: {
    flat: '12',
    area: 'MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
  },
  operating_hours: [
    {
      day_of_week: 0,
      day_name: 'Monday',
      open_time: '09:00',
      close_time: '21:00',
      is_closed: false,
    },
  ],
  tax: { gstin: '29AABPP1234F1Z5', pan_number: 'AABPP1234F' },
  status: 'ACTIVE',
  profile_completeness_pct: 80,
  is_online: true,
};

async function seedOwner(page: Page) {
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
          business_name: 'Sri Rama Medicals',
        },
      }),
    });
  });
  await page.route('**/api/v1/pharmacy/profile/logo', async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          logo_url: `http://localhost/api/v1/public/pharmacy-logos/${PHARMACY_ID}.png`,
          updated_fields: ['logo_url'],
        },
      }),
    });
  });
  await page.route('**/api/v1/pharmacy/profile/completeness', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          completeness_pct: 80,
          missing_fields: [{ field: 'logo_url', label: 'Pharmacy Logo' }],
        },
      }),
    });
  });
  await page.route('**/api/v1/pharmacy/profile/bank-account', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          account_holder: 'Sri Rama Medicals',
          bank_name: 'HDFC Bank',
          account_number_masked: 'XXXXXXXXXXXX4321',
          ifsc_code: 'HDFC0001234',
          verification_status: 'VERIFIED',
        },
      }),
    });
  });
  await page.route('**/api/v1/pharmacy/profile', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { updated_fields: ['tagline'], message: 'ok' },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: profile }),
    });
  });
  await page.route('**/api/v1/pharmacy/storefront', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { is_online: false, admin_forced_offline: false },
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

test.describe('settings federation contract', () => {
  test.skip(
    !hasSettingsRemote,
    'Build @medmate/settings so dist/settings exists',
  );

  test('owner can patch profile', async ({ page }) => {
    await seedOwner(page);
    await page.goto('/settings/profile');
    await expect(
      page.getByRole('heading', { name: 'Pharmacy profile' }),
    ).toBeVisible();
    await page.getByLabel('Tagline').fill('Open late');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByTestId('toast')).toHaveText('Profile saved');
  });

  test('owner can upload a pharmacy logo without a URL', async ({ page }) => {
    await seedOwner(page);
    await page.goto('/settings/profile');
    await expect(page.getByLabel('Pharmacy logo')).toBeVisible();
    await page.getByLabel('Pharmacy logo').setInputFiles({
      name: 'board.png',
      mimeType: 'image/png',
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    });
    await expect(page.getByTestId('toast')).toHaveText('Logo uploaded');
  });

  test('owner can take the storefront offline', async ({ page }) => {
    await seedOwner(page);
    await page.goto('/settings/storefront');
    await expect(
      page.getByRole('heading', { name: 'Storefront' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Set shop offline' }).click();
    await expect(
      page.getByRole('heading', { name: 'Take Sri Rama Medicals offline?' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Take offline' }).click();
    await expect(page.getByTestId('toast')).toHaveText('Storefront updated');
    await expect(page.getByTestId('storefront-chip')).toHaveText('Offline');
  });

  test('staff cannot see the bank form', async ({ page }) => {
    await seedOwner(page);
    await page.addInitScript(() => {
      const raw = sessionStorage.getItem('medmate.portal.session');
      if (!raw) {
        return;
      }
      const snapshot = JSON.parse(raw) as { role: string };
      snapshot.role = 'pharmacy_staff';
      sessionStorage.setItem(
        'medmate.portal.session',
        JSON.stringify(snapshot),
      );
    });
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
            permissions: [],
            active_pharmacy: { id: PHARMACY_ID, name: 'Sri Rama Medicals' },
          },
        }),
      });
    });
    await page.goto('/settings/profile');
    await expect(page.getByLabel('Business name')).toBeVisible();
    await expect(page.getByLabel('Account number')).toHaveCount(0);
  });
});
