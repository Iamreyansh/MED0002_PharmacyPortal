import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import type {
  OnboardingCommand,
  RegisterValues,
} from '@medmate/onboarding-contract';
import { hostApi, resetTokenStore } from '@/modules/api';
import { resetSessionSnapshot } from '@/modules/session';
import { readRegisterEmail } from '@/modules/onboarding/lib/register-email';
import {
  resetRegisterSubmit,
  submitRegister,
} from '@/modules/onboarding/lib/submit-register';
import {
  resetVerifySubmit,
  submitVerify,
} from '@/modules/onboarding/lib/submit-verify';
import { submitStatus } from '@/modules/onboarding/lib/submit-status';
import { submitKyc } from '@/modules/onboarding/lib/submit-kyc';

afterEach(() => {
  vi.restoreAllMocks();
  resetTokenStore();
  resetSessionSnapshot();
  resetRegisterSubmit();
  resetVerifySubmit();
  sessionStorage.removeItem('medmate.portal.register.email');
});

const registerValues: RegisterValues = {
  owner_name: 'Priya Sharma',
  business_name: 'Sri Rama Medicals',
  phone: '+919876543210',
  email: 'priya@srirama.in',
  password: 'Passw0rd!',
  business_type: 'PHARMACY' as const,
  address: {
    flat: '12',
    area: 'MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
  },
  gstin: '29AABPP1234F1Z5',
  drug_licence_number: 'DL-1',
  pan_number: 'AABPP1234F',
};

function registerCommand(
  values = registerValues,
): Extract<OnboardingCommand, { screen: 'register' }> {
  return { screen: 'register', action: 'submit', values };
}

describe('submitRegister', () => {
  it('rejects unsupported commands, validation, and in-flight duplicates', async () => {
    expect(
      await submitRegister(
        { screen: 'status', action: 'load' },
        { navigate: vi.fn() },
      ),
    ).toMatchObject({ ok: false });
    expect(
      await submitRegister(
        registerCommand({ ...registerValues, email: 'bad' }),
        {
          navigate: vi.fn(),
        },
      ),
    ).toMatchObject({ ok: false });
    expect(
      await submitRegister(
        registerCommand({ ...registerValues, owner_name: '  ' }),
        { navigate: vi.fn() },
      ),
    ).toMatchObject({ ok: false });
    expect(
      await submitRegister(
        registerCommand({ ...registerValues, business_name: '' }),
        { navigate: vi.fn() },
      ),
    ).toMatchObject({ ok: false });
    expect(
      await submitRegister(
        registerCommand({ ...registerValues, phone: '9876543210' }),
        { navigate: vi.fn() },
      ),
    ).toMatchObject({ ok: false });
    expect(
      await submitRegister(
        registerCommand({ ...registerValues, password: 'weak' }),
        { navigate: vi.fn() },
      ),
    ).toMatchObject({ ok: false });
    let finish: ((value: HostApiResponse) => void) | undefined;
    vi.spyOn(hostApi, 'request').mockImplementation(
      () =>
        new Promise<HostApiResponse>((resolve) => {
          finish = resolve;
        }),
    );
    const first = submitRegister(registerCommand(), { navigate: vi.fn() });
    const second = await submitRegister(registerCommand(), {
      navigate: vi.fn(),
    });
    expect(second).toMatchObject({ ok: false });
    finish?.({ ok: true, status: 201, data: {} });
    await first;
  });

  it('stores email and navigates to verify', async () => {
    const navigate = vi.fn();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 201,
      data: { pharmacy_id: 'p1', status: 'PENDING_KYC', plan: 'FREE' },
    });
    const result = await submitRegister(
      registerCommand({ ...registerValues, fssai_number: '12345678901234' }),
      { navigate },
    );
    expect(result).toEqual({ ok: true, nextStep: 'verify' });
    expect(readRegisterEmail()).toBe('priya@srirama.in');
    expect(navigate).toHaveBeenCalledWith('/register/verify', {
      replace: true,
    });
  });

  it('maps Core register errors', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 409,
      data: null,
      code: 'EMAIL_ALREADY_REGISTERED',
      message: 'Email already registered.',
    });
    const result = await submitRegister(registerCommand(), {
      navigate: vi.fn(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.email).toBe('Email already registered.');
    }
  });
});

describe('submitVerify', () => {
  it('rejects unsupported screens and OTP shape', async () => {
    const deps = {
      applyMe: vi.fn(),
      applyRegistrationStatus: vi.fn(),
      navigate: vi.fn(),
    };
    expect(
      await submitVerify({ screen: 'status', action: 'load' }, deps),
    ).toMatchObject({ ok: false });
    expect(
      await submitVerify(
        { screen: 'verify', action: 'nope' } as unknown as OnboardingCommand,
        deps,
      ),
    ).toMatchObject({ ok: false });
    expect(
      await submitVerify(
        {
          screen: 'verify',
          action: 'verifyOtp',
          values: { email: 'a@b.c', otp: '12' },
        },
        deps,
      ),
    ).toMatchObject({ ok: false });
  });

  it('resends OTP and hydrates a successful verify', async () => {
    const deps = {
      applyMe: vi.fn(),
      applyRegistrationStatus: vi.fn(),
      navigate: vi.fn(),
    };
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { retry_after_seconds: 60, resends_remaining: 2 },
    });
    expect(
      await submitVerify(
        {
          screen: 'verify',
          action: 'resendOtp',
          values: { email: 'priya@srirama.in' },
        },
        deps,
      ),
    ).toMatchObject({ ok: true, retryAfterSeconds: 60, resendsRemaining: 2 });
    request.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {},
      retryAfterSeconds: 45,
    });
    expect(
      await submitVerify(
        {
          screen: 'verify',
          action: 'resendOtp',
          values: { email: 'priya@srirama.in' },
        },
        deps,
      ),
    ).toMatchObject({ ok: true, retryAfterSeconds: 45 });
    request.mockResolvedValueOnce({
      ok: false,
      status: 429,
      data: null,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds: 12,
      message: 'Too many',
    });
    expect(
      await submitVerify(
        {
          screen: 'verify',
          action: 'resendOtp',
          values: { email: 'priya@srirama.in' },
        },
        deps,
      ),
    ).toMatchObject({ ok: false, retryAfterSeconds: 12 });
    request
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          access_token: 'access',
          refresh_token: 'refresh',
          token_type: 'Bearer',
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { id: 'staff', name: 'Priya', role: 'pharmacy_owner' },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { status: 'PENDING_KYC', plan: 'FREE' },
      });
    expect(
      await submitVerify(
        {
          screen: 'verify',
          action: 'verifyOtp',
          values: { email: 'priya@srirama.in', otp: '123456' },
        },
        deps,
      ),
    ).toEqual({ ok: true, nextStep: 'status' });
    expect(deps.applyMe).toHaveBeenCalled();
    expect(deps.applyRegistrationStatus).toHaveBeenCalled();
    expect(deps.navigate).toHaveBeenCalledWith('/onboarding/status', {
      replace: true,
    });
    request
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          access_token: 'access-2',
          refresh_token: 'refresh-2',
          token_type: 'Bearer',
        },
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        data: null,
        code: 'INTERNAL',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        data: null,
        code: 'INTERNAL',
      });
    expect(
      await submitVerify(
        {
          screen: 'verify',
          action: 'verifyOtp',
          values: { email: 'priya@srirama.in', otp: '123456' },
        },
        deps,
      ),
    ).toEqual({ ok: true, nextStep: 'status' });
  });

  it('sends the user to login when verify has no tokens', async () => {
    const deps = {
      applyMe: vi.fn(),
      applyRegistrationStatus: vi.fn(),
      navigate: vi.fn(),
    };
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { email_verified: true },
    });
    expect(
      await submitVerify(
        {
          screen: 'verify',
          action: 'verifyOtp',
          values: { email: 'priya@srirama.in', otp: '123456' },
        },
        deps,
      ),
    ).toEqual({ ok: true, nextStep: 'login' });
    expect(deps.navigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('maps verify Core errors and in-flight duplicates', async () => {
    const deps = {
      applyMe: vi.fn(),
      applyRegistrationStatus: vi.fn(),
      navigate: vi.fn(),
    };
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 400,
      data: null,
      code: 'INVALID_OTP',
      message: 'OTP is not valid.',
    });
    expect(
      await submitVerify(
        {
          screen: 'verify',
          action: 'verifyOtp',
          values: { email: 'priya@srirama.in', otp: '123456' },
        },
        deps,
      ),
    ).toMatchObject({ ok: false, code: 'INVALID_OTP' });
    let finish: ((value: HostApiResponse) => void) | undefined;
    vi.spyOn(hostApi, 'request').mockImplementation(
      () =>
        new Promise<HostApiResponse>((resolve) => {
          finish = resolve;
        }),
    );
    const first = submitVerify(
      {
        screen: 'verify',
        action: 'verifyOtp',
        values: { email: 'priya@srirama.in', otp: '123456' },
      },
      deps,
    );
    const second = await submitVerify(
      {
        screen: 'verify',
        action: 'verifyOtp',
        values: { email: 'priya@srirama.in', otp: '123456' },
      },
      deps,
    );
    expect(second).toMatchObject({ ok: false });
    finish?.({ ok: true, status: 200, data: { email_verified: true } });
    await first;
  });
});

describe('submitStatus', () => {
  it('loads status or fails', async () => {
    const applyRegistrationStatus = vi.fn();
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { status: 'PENDING_KYC' },
    });
    expect(
      await submitStatus(
        { screen: 'status', action: 'load' },
        { applyRegistrationStatus },
      ),
    ).toMatchObject({ ok: true });
    expect(applyRegistrationStatus).toHaveBeenCalled();
    expect(
      await submitStatus(
        { screen: 'kyc', action: 'list' },
        { applyRegistrationStatus },
      ),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 401,
      data: null,
      code: 'UNAUTHORIZED',
    });
    expect(
      await submitStatus(
        { screen: 'status', action: 'refresh' },
        { applyRegistrationStatus },
      ),
    ).toMatchObject({ ok: false });
  });
});

describe('submitKyc', () => {
  it('lists, uploads, deletes, and submits', async () => {
    const applyRegistrationStatus = vi.fn();
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { documents: [], ready_to_submit: false },
    });
    expect(
      await submitKyc(
        { screen: 'kyc', action: 'list' },
        { applyRegistrationStatus },
      ),
    ).toMatchObject({ ok: true });
    request
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: { document_id: 'd1' },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { documents: [], ready_to_submit: true },
      });
    const file = new File(['x'], 'gstin.pdf', { type: 'application/pdf' });
    expect(
      await submitKyc(
        {
          screen: 'kyc',
          action: 'upload',
          values: {
            document_type: 'GSTIN_CERTIFICATE',
            file,
            expiry_date: '2027-12-31',
          },
        },
        { applyRegistrationStatus },
      ),
    ).toMatchObject({ ok: true });
    request
      .mockResolvedValueOnce({ ok: true, status: 200, data: {} })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { documents: [] },
      });
    expect(
      await submitKyc(
        {
          screen: 'kyc',
          action: 'delete',
          values: { document_id: 'd1' },
        },
        { applyRegistrationStatus },
      ),
    ).toMatchObject({ ok: true });
    request
      .mockResolvedValueOnce({ ok: true, status: 200, data: {} })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: { status: 'KYC_SUBMITTED' },
      });
    expect(
      await submitKyc(
        { screen: 'kyc', action: 'submit' },
        { applyRegistrationStatus },
      ),
    ).toEqual({ ok: true, nextStep: 'status' });
    expect(applyRegistrationStatus).toHaveBeenCalled();
    request
      .mockResolvedValueOnce({ ok: true, status: 200, data: {} })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        data: null,
        code: 'INTERNAL',
      });
    expect(
      await submitKyc(
        { screen: 'kyc', action: 'submit' },
        { applyRegistrationStatus },
      ),
    ).toEqual({ ok: true, nextStep: 'status' });
  });

  it('maps KYC failures', async () => {
    const applyRegistrationStatus = vi.fn();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 400,
      data: null,
      code: 'DOCUMENTS_INCOMPLETE',
      message: 'Incomplete',
      details: { missing_types: ['PAN_CARD'] },
    });
    expect(
      await submitKyc(
        { screen: 'status', action: 'load' },
        { applyRegistrationStatus },
      ),
    ).toMatchObject({ ok: false });
    expect(
      await submitKyc(
        { screen: 'kyc', action: 'nope' } as unknown as OnboardingCommand,
        { applyRegistrationStatus },
      ),
    ).toMatchObject({ ok: false });
    expect(
      await submitKyc(
        { screen: 'kyc', action: 'list' },
        { applyRegistrationStatus },
      ),
    ).toMatchObject({ ok: false });
    const file = new File(['x'], 'x.pdf', { type: 'application/pdf' });
    expect(
      await submitKyc(
        {
          screen: 'kyc',
          action: 'upload',
          values: { document_type: 'PAN_CARD', file },
        },
        { applyRegistrationStatus },
      ),
    ).toMatchObject({ ok: false });
    expect(
      await submitKyc(
        {
          screen: 'kyc',
          action: 'delete',
          values: { document_id: 'd1' },
        },
        { applyRegistrationStatus },
      ),
    ).toMatchObject({ ok: false });
    const submit = await submitKyc(
      { screen: 'kyc', action: 'submit' },
      { applyRegistrationStatus },
    );
    expect(submit).toMatchObject({
      ok: false,
      missingTypes: ['PAN_CARD'],
    });
  });
});
