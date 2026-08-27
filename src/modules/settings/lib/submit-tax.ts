import type {
  SettingsCommand,
  SettingsSubmitResult,
} from '@medmate/settings-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/settings/lib/errors';

export async function submitTax(
  command: SettingsCommand,
): Promise<SettingsSubmitResult> {
  if (command.screen !== 'profile' || command.action !== 'saveTax') {
    return { ok: false, formError: 'This screen cannot update tax.' };
  }
  const result = await hostApi.request<Record<string, unknown>>({
    path: '/api/v1/pharmacy/profile/tax',
    method: 'PATCH',
    body: command.values,
    idempotencyKey: createIdempotencyKey(),
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  return { ok: true, tax: result.data ?? {} };
}
