import type { AuthCommand, AuthSubmitResult } from '@medmate/auth-contract';
import { hostApi } from '@/modules/api';
import { loginErrorCopy } from '@/modules/auth/lib/errors';
import {
  isValidIdentifier,
  normalizeIdentifier,
} from '@/modules/auth/lib/identifier';

let forgotInFlight = false;

export function resetForgotSubmit(): void {
  forgotInFlight = false;
}

export async function submitForgot(
  command: AuthCommand,
): Promise<AuthSubmitResult> {
  if (
    command.portalType !== 'pharmacy-forgot' ||
    command.action !== 'request'
  ) {
    return {
      ok: false,
      formError: 'This portal does not support that sign-in method.',
    };
  }
  if (forgotInFlight) {
    return { ok: false, formError: 'A reset request is already in progress.' };
  }
  const identifier = normalizeIdentifier(command.values.identifier);
  if (!identifier) {
    return {
      ok: false,
      fieldErrors: { identifier: 'Enter your email or +91 mobile number.' },
    };
  }
  if (!isValidIdentifier(identifier)) {
    return {
      ok: false,
      fieldErrors: { identifier: 'Use an email or +91 mobile number.' },
    };
  }
  forgotInFlight = true;
  try {
    const result = await hostApi.request<Record<string, unknown>>({
      path: '/api/v1/auth/pharmacy/forgot-password',
      method: 'POST',
      body: { identifier },
    });
    if (result.ok) {
      return { ok: true, nextStep: 'done' };
    }
    if (result.status === 429) {
      return {
        ok: false,
        code: result.code,
        retryAfterSeconds: result.retryAfterSeconds,
        formError:
          result.message ??
          (result.retryAfterSeconds
            ? `Too many attempts. Retry in ${result.retryAfterSeconds}s.`
            : 'Too many attempts. Try again shortly.'),
      };
    }
    return {
      ok: false,
      code: result.code,
      formError: loginErrorCopy(result.code, result.message, result.details),
    };
  } finally {
    forgotInFlight = false;
  }
}
