import type {
  ProfilePayload,
  SettingsCommand,
  SettingsSubmitResult,
} from '@medmate/settings-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/settings/lib/errors';

export async function submitLogo(
  command: SettingsCommand,
): Promise<SettingsSubmitResult> {
  if (command.screen !== 'profile' || command.action !== 'uploadLogo') {
    return { ok: false, formError: 'This screen cannot upload a logo.' };
  }
  const file = command.values.file;
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      formError: 'Choose a PNG or JPG image.',
      fieldErrors: { logo_url: 'Choose a PNG or JPG image.' },
    };
  }
  const form = new FormData();
  form.append('file', file, file.name);
  const result = await hostApi.request<ProfilePayload>({
    path: '/api/v1/pharmacy/profile/logo',
    method: 'POST',
    body: form,
    idempotencyKey: createIdempotencyKey(),
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  return { ok: true, profile: { logo_url: result.data?.logo_url } };
}
