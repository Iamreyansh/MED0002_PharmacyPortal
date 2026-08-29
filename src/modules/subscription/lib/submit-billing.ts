import type {
  SaasInvoice,
  SubscriptionCommand,
  SubscriptionSubmitResult,
} from '@medmate/subscription-contract';
import { publicPayFields } from '@medmate/subscription-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/subscription/lib/errors';

const INVOICES_PATH = '/api/v1/pharmacy/billing/invoices';
const PAY_PATH = '/api/v1/pharmacy/billing/pay';

function asList(data: unknown): SaasInvoice[] {
  if (Array.isArray(data)) {
    return data as SaasInvoice[];
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.invoices)) {
      return record.invoices as SaasInvoice[];
    }
    if (Array.isArray(record.items)) {
      return record.items as SaasInvoice[];
    }
  }
  return [];
}

function asInvoice(data: unknown): SaasInvoice | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  return data as SaasInvoice;
}

export async function submitBilling(
  command: SubscriptionCommand,
): Promise<SubscriptionSubmitResult> {
  if (command.screen !== 'billing') {
    return { ok: false, formError: 'This screen cannot update billing.' };
  }
  switch (command.action) {
    case 'load': {
      const result = await hostApi.request<unknown>({
        path: INVOICES_PATH,
        method: 'GET',
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, invoices: asList(result.data) };
    }
    case 'loadInvoice': {
      const result = await hostApi.request<unknown>({
        path: `${INVOICES_PATH}/${command.values.id}`,
        method: 'GET',
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, invoice: asInvoice(result.data) };
    }
    case 'pay': {
      const result = await hostApi.request<unknown>({
        path: PAY_PATH,
        method: 'POST',
        body: { invoice_id: command.values.invoice_id },
        idempotencyKey: command.values.idempotencyKey ?? createIdempotencyKey(),
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, pay: publicPayFields(result.data) };
    }
    default:
      return { ok: false, formError: 'This screen cannot update billing.' };
  }
}
