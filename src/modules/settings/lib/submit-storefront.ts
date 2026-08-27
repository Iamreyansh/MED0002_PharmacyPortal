import type {
  SettingsCommand,
  SettingsSubmitResult,
  StorefrontPayload,
} from '@medmate/settings-contract';
import { STOREFRONT_EVENT } from '@medmate/settings-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { emitHostEvent } from '@/modules/mfe/lib/host-events';
import { failureResult } from '@/modules/settings/lib/errors';
import { applyStorefrontStatus } from '@/modules/settings/store/storefront-status';

export async function submitStorefront(
  command: SettingsCommand,
): Promise<SettingsSubmitResult> {
  if (command.screen !== 'storefront' || command.action !== 'save') {
    return { ok: false, formError: 'This screen cannot update storefront.' };
  }
  const result = await hostApi.request<StorefrontPayload>({
    path: '/api/v1/pharmacy/storefront',
    method: 'PATCH',
    body: { is_online: command.values.is_online },
    idempotencyKey: createIdempotencyKey(),
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  const storefront = result.data ?? { is_online: command.values.is_online };
  applyStorefrontStatus(storefront);
  emitHostEvent(STOREFRONT_EVENT, storefront);
  return { ok: true, storefront };
}
