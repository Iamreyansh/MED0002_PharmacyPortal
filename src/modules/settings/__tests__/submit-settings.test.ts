import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { hostApi } from '@/modules/api';
import { submitBank } from '@/modules/settings/lib/submit-bank';
import { submitCompleteness } from '@/modules/settings/lib/submit-completeness';
import { submitContact } from '@/modules/settings/lib/submit-contact';
import { submitLogo } from '@/modules/settings/lib/submit-logo';
import { submitProfile } from '@/modules/settings/lib/submit-profile';
import { submitStorefront } from '@/modules/settings/lib/submit-storefront';
import { submitTax } from '@/modules/settings/lib/submit-tax';
import { getStorefrontStatus } from '@/modules/settings/store/storefront-status';

afterEach(() => {
  vi.restoreAllMocks();
});

function ok<T>(data: T, status = 200): HostApiResponse<T> {
  return { ok: true, status, data };
}

function fail(
  code: string,
  message = code,
  status = 403,
): HostApiResponse<never> {
  return { ok: false, status, data: undefined as never, code, message };
}

describe('settings submitters', () => {
  it('rejects mismatched commands', async () => {
    expect(
      await submitProfile({
        screen: 'storefront',
        action: 'save',
        values: { is_online: true },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitProfile({ screen: 'profile', action: 'loadBank' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitCompleteness({ screen: 'profile', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitTax({ screen: 'profile', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitBank({
        screen: 'storefront',
        action: 'save',
        values: { is_online: true },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitBank({ screen: 'profile', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitContact({ screen: 'profile', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitStorefront({ screen: 'profile', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitLogo({ screen: 'profile', action: 'load' }),
    ).toMatchObject({ ok: false });
  });

  it('loads and patches profile', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ business_name: 'Shop', is_online: true }),
    );
    const loaded = await submitProfile({ screen: 'profile', action: 'load' });
    expect(loaded).toMatchObject({ ok: true, profile: { is_online: true } });
    expect(getStorefrontStatus().isOnline).toBe(true);
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('UNAUTHORIZED'));
    expect(
      await submitProfile({ screen: 'profile', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ updated_fields: ['tagline'] }),
    );
    expect(
      await submitProfile({
        screen: 'profile',
        action: 'save',
        values: { tagline: 'Open late' },
      }),
    ).toMatchObject({ ok: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('VALIDATION_ERROR', 'Check fields', 400),
    );
    expect(
      await submitProfile({
        screen: 'profile',
        action: 'save',
        values: { tagline: '' },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
  });

  it('loads completeness, tax, bank, and contact', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ completeness_pct: 80, missing_fields: [] }),
    );
    expect(
      await submitCompleteness({
        screen: 'profile',
        action: 'loadCompleteness',
      }),
    ).toMatchObject({ ok: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('PHARMACY_NOT_ACTIVE'),
    );
    expect(
      await submitCompleteness({
        screen: 'profile',
        action: 'loadCompleteness',
      }),
    ).toMatchObject({ ok: false, code: 'PHARMACY_NOT_ACTIVE' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ message: 'Tax details updated successfully.' }),
    );
    expect(
      await submitTax({
        screen: 'profile',
        action: 'saveTax',
        values: { gstin: '29AABPP1234F1Z5' },
      }),
    ).toMatchObject({ ok: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitTax({
        screen: 'profile',
        action: 'saveTax',
        values: { gstin: 'bad' },
      }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ account_number_masked: 'XXXXXXXXXXXX4321' }),
    );
    expect(
      await submitBank({ screen: 'profile', action: 'loadBank' }),
    ).toMatchObject({
      ok: true,
      bank: { account_number_masked: 'XXXXXXXXXXXX4321' },
    });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(undefined as never));
    expect(
      await submitBank({ screen: 'profile', action: 'loadBank' }),
    ).toMatchObject({ ok: true, bank: null });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitBank({ screen: 'profile', action: 'loadBank' }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ account_number_masked: 'XXXXXXXXXXXX9999' }, 201),
    );
    expect(
      await submitBank({
        screen: 'profile',
        action: 'saveBank',
        values: {
          account_holder: 'Priya',
          bank_name: 'SBI',
          account_number: '123456789012',
          ifsc_code: 'SBIN0001234',
          account_type: 'SAVINGS',
        },
      }),
    ).toMatchObject({ ok: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('INVALID_IFSC'));
    expect(
      await submitBank({
        screen: 'profile',
        action: 'saveBank',
        values: {
          account_holder: 'Priya',
          bank_name: 'SBI',
          account_number: '123456789012',
          ifsc_code: 'BAD',
          account_type: 'CURRENT',
        },
      }),
    ).toMatchObject({ ok: false, code: 'INVALID_IFSC' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ verified: true, channel: 'PHONE' }),
    );
    expect(
      await submitContact({
        screen: 'profile',
        action: 'verifyContact',
        values: { channel: 'PHONE', otp: '123456' },
      }),
    ).toMatchObject({ ok: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('INVALID_OTP'));
    expect(
      await submitContact({
        screen: 'profile',
        action: 'verifyContact',
        values: { channel: 'EMAIL', otp: '000000' },
      }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(undefined as never));
    expect(
      await submitTax({
        screen: 'profile',
        action: 'saveTax',
        values: {},
      }),
    ).toMatchObject({ ok: true, tax: {} });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(undefined as never));
    expect(
      await submitContact({
        screen: 'profile',
        action: 'verifyContact',
        values: { channel: 'PHONE', otp: '123456' },
      }),
    ).toMatchObject({ ok: true, contact: {} });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(undefined as never));
    expect(
      await submitBank({
        screen: 'profile',
        action: 'saveBank',
        values: {
          account_holder: 'A',
          bank_name: 'B',
          account_number: '123456789',
          ifsc_code: 'HDFC0001234',
          account_type: 'CURRENT',
        },
      }),
    ).toMatchObject({ ok: true, bank: null });
    const png = new File(['png'], 'shop.png', { type: 'image/png' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ logo_url: 'https://api.example/shop.png' }, 201),
    );
    expect(
      await submitLogo({
        screen: 'profile',
        action: 'uploadLogo',
        values: { file: png },
      }),
    ).toMatchObject({
      ok: true,
      profile: { logo_url: 'https://api.example/shop.png' },
    });
    expect(
      await submitLogo({
        screen: 'profile',
        action: 'uploadLogo',
        values: { file: new File([], 'empty.png', { type: 'image/png' }) },
      }),
    ).toMatchObject({
      ok: false,
      fieldErrors: { logo_url: 'Choose a PNG or JPG image.' },
    });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('INVALID_LOGO', 'Logo must be PNG or JPG', 400),
    );
    expect(
      await submitLogo({
        screen: 'profile',
        action: 'uploadLogo',
        values: { file: png },
      }),
    ).toMatchObject({ ok: false, code: 'INVALID_LOGO' });
  });

  it('patches storefront and caches status', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ is_online: false, admin_forced_offline: false }),
    );
    expect(
      await submitStorefront({
        screen: 'storefront',
        action: 'save',
        values: { is_online: false },
      }),
    ).toMatchObject({ ok: true });
    expect(getStorefrontStatus().isOnline).toBe(false);
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('ADMIN_OVERRIDE_ACTIVE'),
    );
    expect(
      await submitStorefront({
        screen: 'storefront',
        action: 'save',
        values: { is_online: true },
      }),
    ).toMatchObject({ ok: false, code: 'ADMIN_OVERRIDE_ACTIVE' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(undefined as never));
    expect(
      await submitStorefront({
        screen: 'storefront',
        action: 'save',
        values: { is_online: true },
      }),
    ).toMatchObject({
      ok: true,
      storefront: { is_online: true },
    });
  });
});
