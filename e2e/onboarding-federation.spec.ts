import fs from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const DIST_ROOT =
  process.env.VITE_MFE_DIST_ROOT?.replace(/\/$/, '') ??
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
const hasOnboardingRemote = fs.existsSync(
  `${DIST_ROOT}/onboarding/mf-manifest.json`,
);

const STAFF_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PHARMACY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

async function mockMeAndStatus(page: Page, status = 'PENDING_KYC') {
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
          status,
          plan: 'FREE',
          email_verified: true,
          business_name: 'Sri Rama Medicals',
        },
      }),
    });
  });
}

test.describe('onboarding federation contract', () => {
  test.skip(
    !hasOnboardingRemote,
    'Build @medmate/onboarding so dist/onboarding exists',
  );

  test('register success continues to verify', async ({ page }) => {
    await page.route('**/api/v1/pharmacy/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            pharmacy_id: PHARMACY_ID,
            status: 'PENDING_KYC',
            plan: 'FREE',
            email_verification_required: true,
          },
        }),
      });
    });
    await page.goto('/register');
    await expect(
      page.getByRole('heading', { name: 'Create your pharmacy' }),
    ).toBeVisible();
    await page.getByLabel('Owner name').fill('Priya Sharma');
    await page.getByLabel('Email').fill('priya@srirama.in');
    await page.getByLabel('Mobile').fill('+919876543210');
    await page.getByLabel('Password').fill('Passw0rd!');
    await page.getByLabel('Business name').fill('Sri Rama Medicals');
    await page.getByLabel('Flat / street').fill('12');
    await page.getByLabel('Area').fill('MG Road');
    await page.getByLabel('City').fill('Bengaluru');
    await page.getByLabel('Pincode').fill('560001');
    await page.getByLabel('GSTIN').fill('29AABPP1234F1Z5');
    await page.getByLabel('PAN').fill('AABPP1234F');
    await page.getByLabel('Drug licence number').fill('DL-1');
    await page.getByRole('button', { name: 'Create Free account' }).click();
    await expect(page).toHaveURL(/\/register\/verify$/);
    await expect(
      page.getByRole('heading', { name: 'Verify email' }),
    ).toBeVisible();
    await expect(page.getByRole('group', { name: 'Email OTP' })).toBeVisible();
  });

  test('pending KYC status shows the KYC CTA', async ({ page }) => {
    await mockMeAndStatus(page);
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
    await page.goto('/onboarding/status');
    await expect(
      page.getByRole('heading', { name: 'Registration status' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Upload KYC documents' }),
    ).toBeVisible();
  });
});
