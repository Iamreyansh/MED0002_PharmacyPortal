import type {
  BillingCommand,
  BillingSubmitResult,
  InvoiceSettings,
} from '@medmate/billing-contract';
import { hostApi } from '@/modules/api';
import { failureResult } from '@/modules/billing/lib/errors';
import { asObject } from '@/modules/billing/lib/query';

const SETTINGS_PATH = '/api/v1/pharmacy/invoice-settings';

export async function submitInvoiceSettings(
  command: BillingCommand,
): Promise<BillingSubmitResult> {
  if (command.screen !== 'invoice-settings') {
    return {
      ok: false,
      formError: 'This screen cannot load invoice settings.',
    };
  }
  if (command.action === 'load') {
    const result = await hostApi.request<unknown>({
      path: SETTINGS_PATH,
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, settings: asObject<InvoiceSettings>(result.data) };
  }
  if (command.action === 'save') {
    const result = await hostApi.request<unknown>({
      path: SETTINGS_PATH,
      method: 'PATCH',
      body: command.values,
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, settings: asObject<InvoiceSettings>(result.data) };
  }
  return { ok: false, formError: 'This screen cannot load invoice settings.' };
}
