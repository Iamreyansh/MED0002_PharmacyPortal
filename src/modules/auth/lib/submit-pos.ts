import { flushSync } from 'react-dom';
import type { AuthCommand, AuthSubmitResult } from '@medmate/auth-contract';
import { applyTokenPair, hostApi } from '@/modules/api';
import { loginErrorCopy } from '@/modules/auth/lib/errors';
import { isUuid } from '@/modules/auth/lib/identifier';
import { writePosLastIds } from '@/modules/auth/lib/pos-last';

export type PosSubmitDeps = {
  applyPosLogin: (data: Record<string, unknown>) => void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
};

let posInFlight = false;

export function resetPosSubmit(): void {
  posInFlight = false;
}

export async function submitPos(
  command: AuthCommand,
  deps: PosSubmitDeps,
): Promise<AuthSubmitResult> {
  if (command.portalType !== 'pos' || command.action !== 'login') {
    return {
      ok: false,
      formError: 'This portal does not support that sign-in method.',
    };
  }
  if (posInFlight) {
    return { ok: false, formError: 'Sign-in is already in progress.' };
  }

  const { pharmacyId, staffId, pin } = command.values;
  if (!isUuid(pharmacyId) || !isUuid(staffId)) {
    return {
      ok: false,
      fieldErrors: {
        pharmacyId: 'Pharmacy and staff IDs are required.',
        staffId: 'Pharmacy and staff IDs are required.',
      },
      formError: 'Pharmacy and staff IDs are required.',
    };
  }
  if (pin.length !== 4) {
    return {
      ok: false,
      fieldErrors: { pin: 'Enter a 4-digit PIN.' },
      formError: 'Enter a 4-digit PIN.',
    };
  }

  posInFlight = true;
  try {
    const result = await hostApi.request<Record<string, unknown>>({
      path: '/api/v1/auth/pharmacy/pos-pin',
      method: 'POST',
      body: { pharmacy_id: pharmacyId, staff_id: staffId, pin },
    });
    if (result.ok && result.data && applyTokenPair(result.data)) {
      flushSync(() => {
        deps.applyPosLogin(result.data);
      });
      writePosLastIds(pharmacyId, staffId);
      deps.navigate('/pos', { replace: true });
      return { ok: true, nextStep: 'done' };
    }
    return {
      ok: false,
      code: result.code,
      fieldErrors:
        result.code === 'INVALID_PIN' ? { pin: 'Clear PIN' } : undefined,
      formError: loginErrorCopy(result.code, result.message, result.details),
    };
  } finally {
    posInFlight = false;
  }
}
