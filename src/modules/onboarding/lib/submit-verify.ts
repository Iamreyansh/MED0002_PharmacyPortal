import { flushSync } from 'react-dom';
import type {
  OnboardingCommand,
  OnboardingSubmitResult,
} from '@medmate/onboarding-contract';
import { isValidOtp } from '@medmate/onboarding-contract';
import { applyTokenPair, createIdempotencyKey, hostApi } from '@/modules/api';
import {
  fieldErrorsFromDetails,
  onboardingErrorCopy,
} from '@/modules/onboarding/lib/errors';
import { clearRegisterEmail } from '@/modules/onboarding/lib/register-email';

export type VerifySubmitDeps = {
  applyMe: (data: Record<string, unknown>) => void;
  applyRegistrationStatus: (data: Record<string, unknown>) => void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
};

let verifyInFlight = false;

export function resetVerifySubmit(): void {
  verifyInFlight = false;
}

export async function submitVerify(
  command: OnboardingCommand,
  deps: VerifySubmitDeps,
): Promise<OnboardingSubmitResult> {
  if (command.screen !== 'verify') {
    return { ok: false, formError: 'This screen cannot verify email.' };
  }
  if (command.action === 'resendOtp') {
    const result = await hostApi.request<Record<string, unknown>>({
      path: '/api/v1/pharmacy/register/resend-otp',
      method: 'POST',
      body: { email: command.values.email },
      idempotencyKey: createIdempotencyKey(),
    });
    if (result.ok) {
      const retry =
        typeof result.data?.retry_after_seconds === 'number'
          ? result.data.retry_after_seconds
          : result.retryAfterSeconds;
      const remaining =
        typeof result.data?.resends_remaining === 'number'
          ? result.data.resends_remaining
          : undefined;
      return {
        ok: true,
        retryAfterSeconds: retry,
        resendsRemaining: remaining,
      };
    }
    return {
      ok: false,
      code: result.code,
      retryAfterSeconds: result.retryAfterSeconds,
      formError: onboardingErrorCopy(result.code, result.message),
    };
  }
  if (command.action !== 'verifyOtp') {
    return { ok: false, formError: 'This screen cannot verify email.' };
  }
  if (verifyInFlight) {
    return { ok: false, formError: 'Verification is already in progress.' };
  }
  if (!isValidOtp(command.values.otp)) {
    return {
      ok: false,
      fieldErrors: { otp: 'Enter the 6-digit OTP.' },
      formError: 'Enter the 6-digit OTP.',
    };
  }
  verifyInFlight = true;
  try {
    const result = await hostApi.request<Record<string, unknown>>({
      path: '/api/v1/pharmacy/register/verify-email',
      method: 'POST',
      body: { email: command.values.email, otp: command.values.otp },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok || !result.data) {
      return {
        ok: false,
        code: result.code,
        fieldErrors: fieldErrorsFromDetails(
          result.code,
          result.message,
          result.details,
        ),
        formError: onboardingErrorCopy(result.code, result.message),
      };
    }
    if (!applyTokenPair(result.data)) {
      deps.navigate('/login', { replace: true });
      return { ok: true, nextStep: 'login' };
    }
    const me = await hostApi.request<Record<string, unknown>>({
      path: '/api/v1/auth/me',
      method: 'GET',
    });
    if (me.ok && me.data && typeof me.data === 'object') {
      flushSync(() => {
        deps.applyMe(me.data);
      });
    }
    const status = await hostApi.request<Record<string, unknown>>({
      path: '/api/v1/pharmacy/registration-status',
      method: 'GET',
    });
    if (status.ok && status.data && typeof status.data === 'object') {
      deps.applyRegistrationStatus(status.data);
    }
    clearRegisterEmail();
    deps.navigate('/onboarding/status', { replace: true });
    return { ok: true, nextStep: 'status' };
  } finally {
    verifyInFlight = false;
  }
}
