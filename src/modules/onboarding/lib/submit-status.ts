import type {
  OnboardingCommand,
  OnboardingSubmitResult,
  RegistrationStatusPayload,
} from '@medmate/onboarding-contract';
import { hostApi } from '@/modules/api';
import { onboardingErrorCopy } from '@/modules/onboarding/lib/errors';

export type StatusSubmitDeps = {
  applyRegistrationStatus: (data: Record<string, unknown>) => void;
};

export async function submitStatus(
  command: OnboardingCommand,
  deps: StatusSubmitDeps,
): Promise<OnboardingSubmitResult> {
  if (command.screen !== 'status') {
    return { ok: false, formError: 'This screen cannot load status.' };
  }
  const result = await hostApi.request<Record<string, unknown>>({
    path: '/api/v1/pharmacy/registration-status',
    method: 'GET',
  });
  if (!result.ok || !result.data || typeof result.data !== 'object') {
    return {
      ok: false,
      code: result.code,
      formError: onboardingErrorCopy(result.code, result.message),
    };
  }
  deps.applyRegistrationStatus(result.data);
  return {
    ok: true,
    status: result.data as RegistrationStatusPayload,
  };
}
