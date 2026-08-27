import type {
  CompletenessPayload,
  SettingsCommand,
  SettingsSubmitResult,
} from '@medmate/settings-contract';
import { hostApi } from '@/modules/api';
import { failureResult } from '@/modules/settings/lib/errors';

export async function submitCompleteness(
  command: SettingsCommand,
): Promise<SettingsSubmitResult> {
  if (command.screen !== 'profile' || command.action !== 'loadCompleteness') {
    return { ok: false, formError: 'This screen cannot load completeness.' };
  }
  const result = await hostApi.request<CompletenessPayload>({
    path: '/api/v1/pharmacy/profile/completeness',
    method: 'GET',
  });
  if (!result.ok || !result.data) {
    return failureResult(result.code, result.message, result.details);
  }
  return { ok: true, completeness: result.data };
}
