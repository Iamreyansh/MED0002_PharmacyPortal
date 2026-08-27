import type {
  ProfilePayload,
  ProfilePatchValues,
  ProfileSavePayload,
  SettingsCommand,
  SettingsSubmitResult,
} from '@medmate/settings-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/settings/lib/errors';
import { applyStorefrontStatus } from '@/modules/settings/store/storefront-status';

export async function submitProfile(
  command: SettingsCommand,
): Promise<SettingsSubmitResult> {
  if (command.screen !== 'profile') {
    return { ok: false, formError: 'This screen cannot update profile.' };
  }
  if (command.action === 'load') {
    const result = await hostApi.request<ProfilePayload>({
      path: '/api/v1/pharmacy/profile',
      method: 'GET',
    });
    if (!result.ok || !result.data) {
      return failureResult(result.code, result.message, result.details);
    }
    applyStorefrontStatus(result.data);
    return { ok: true, profile: result.data };
  }
  if (command.action !== 'save') {
    return { ok: false, formError: 'This screen cannot update profile.' };
  }
  const result = await hostApi.request<ProfileSavePayload>({
    path: '/api/v1/pharmacy/profile',
    method: 'PATCH',
    body: command.values satisfies ProfilePatchValues,
    idempotencyKey: createIdempotencyKey(),
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  return { ok: true, save: result.data };
}
