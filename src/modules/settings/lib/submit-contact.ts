import type {
  SettingsCommand,
  SettingsSubmitResult,
} from '@medmate/settings-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/settings/lib/errors';

export async function submitContact(
  command: SettingsCommand,
): Promise<SettingsSubmitResult> {
  if (command.screen !== 'profile' || command.action !== 'verifyContact') {
    return { ok: false, formError: 'This screen cannot verify contact.' };
  }
  const result = await hostApi.request<Record<string, unknown>>({
    path: '/api/v1/pharmacy/profile/verify-contact',
    method: 'POST',
    body: command.values,
    idempotencyKey: createIdempotencyKey(),
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  return { ok: true, contact: result.data ?? {} };
}
