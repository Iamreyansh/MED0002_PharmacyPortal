import type { AuthCommand, AuthSubmitResult } from '@medmate/auth-contract';
import { hostApi } from '@/modules/api';
import { loginErrorCopy } from '@/modules/auth/lib/errors';

let resetInFlight = false;

export function resetCompleteSubmit(): void {
  resetInFlight = false;
}

export async function submitReset(
  command: AuthCommand,
  deps: { navigate: (path: string, options?: { replace?: boolean }) => void },
): Promise<AuthSubmitResult> {
  if (
    command.portalType !== 'pharmacy-reset' ||
    command.action !== 'complete'
  ) {
    return {
      ok: false,
      formError: 'This portal does not support that sign-in method.',
    };
  }
  if (resetInFlight) {
    return { ok: false, formError: 'A reset is already in progress.' };
  }
  const token = command.values.resetToken?.trim() ?? '';
  const password = command.values.password;
  const fieldErrors: Record<string, string> = {};
  if (!token) {
    fieldErrors.token = 'Enter the token from your owner or email.';
  }
  if (!password || password.length < 8) {
    fieldErrors.password =
      'Use at least 8 characters with upper, digit, and special.';
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }
  resetInFlight = true;
  try {
    const result = await hostApi.request<Record<string, unknown>>({
      path: '/api/v1/auth/pharmacy/complete-reset',
      method: 'POST',
      body: { token, password },
    });
    if (result.ok) {
      deps.navigate('/login', { replace: true });
      return { ok: true, nextStep: 'done' };
    }
    return {
      ok: false,
      code: result.code,
      formError: loginErrorCopy(result.code, result.message, result.details),
    };
  } finally {
    resetInFlight = false;
  }
}
