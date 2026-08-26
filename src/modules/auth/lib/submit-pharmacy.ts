import { flushSync } from 'react-dom';
import type { AuthCommand, AuthSubmitResult } from '@medmate/auth-contract';
import { postAuthPath, readReturnParam } from '@/app/router/route-policy';
import { applyTokenPair, getTokens, hostApi } from '@/modules/api';
import { loginErrorCopy } from '@/modules/auth/lib/errors';
import {
  isValidIdentifier,
  normalizeIdentifier,
} from '@/modules/auth/lib/identifier';
import { sessionFromLogin } from '@/modules/session';

export type PharmacySubmitDeps = {
  applyLogin: (data: Record<string, unknown>) => void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  search: string;
};

let pharmacyInFlight = false;

export function resetPharmacySubmit(): void {
  pharmacyInFlight = false;
}

export async function submitPharmacy(
  command: AuthCommand,
  deps: PharmacySubmitDeps,
): Promise<AuthSubmitResult> {
  if (command.portalType !== 'pharmacy' || command.action !== 'login') {
    return {
      ok: false,
      formError: 'This portal does not support that sign-in method.',
    };
  }
  if (pharmacyInFlight) {
    return { ok: false, formError: 'Sign-in is already in progress.' };
  }

  const identifier = normalizeIdentifier(command.values.identifier);
  const password = command.values.password;
  const fieldErrors: Record<string, string> = {};
  if (!identifier) {
    fieldErrors.identifier = 'Enter your email or +91 mobile number.';
  } else if (!isValidIdentifier(identifier)) {
    fieldErrors.identifier = 'Use an email or +91 mobile number.';
  }
  if (!password) {
    fieldErrors.password = 'Enter your password.';
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  pharmacyInFlight = true;
  try {
    const result = await hostApi.request<Record<string, unknown>>({
      path: '/api/v1/auth/pharmacy/login',
      method: 'POST',
      body: { identifier, password },
    });
    if (result.ok && result.data && applyTokenPair(result.data)) {
      flushSync(() => {
        deps.applyLogin(result.data);
      });
      const hydrated = sessionFromLogin(result.data, getTokens().tokenScope);
      deps.navigate(
        postAuthPath(hydrated.session, readReturnParam(deps.search)),
        { replace: true },
      );
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
    pharmacyInFlight = false;
  }
}
