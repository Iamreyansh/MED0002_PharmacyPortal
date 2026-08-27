import type {
  BankSummary,
  SettingsCommand,
  SettingsSubmitResult,
} from '@medmate/settings-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/settings/lib/errors';

export async function submitBank(
  command: SettingsCommand,
): Promise<SettingsSubmitResult> {
  if (command.screen !== 'profile') {
    return { ok: false, formError: 'This screen cannot update bank details.' };
  }
  if (command.action === 'loadBank') {
    const result = await hostApi.request<BankSummary>({
      path: '/api/v1/pharmacy/profile/bank-account',
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, bank: result.data ?? null };
  }
  if (command.action !== 'saveBank') {
    return { ok: false, formError: 'This screen cannot update bank details.' };
  }
  const result = await hostApi.request<BankSummary>({
    path: '/api/v1/pharmacy/profile/bank-account',
    method: 'POST',
    body: command.values,
    idempotencyKey: createIdempotencyKey(),
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  return { ok: true, bank: result.data ?? null };
}
