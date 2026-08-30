import type {
  BillingCommand,
  BillingSubmitResult,
  InvoiceDetail,
  InvoiceListRow,
  InvoiceShareResult,
} from '@medmate/billing-contract';
import { hostApi } from '@/modules/api';
import { downloadBlob } from '@/modules/billing/lib/download';
import { failureResult } from '@/modules/billing/lib/errors';
import {
  asCollection,
  asObject,
  asMeta,
  withQuery,
} from '@/modules/billing/lib/query';

const LIST_PATH = '/api/v1/pharmacy/invoices';

function invoicePath(invoiceId: string, suffix = ''): string {
  return `${LIST_PATH}/${invoiceId}${suffix}`;
}

export async function submitInvoices(
  command: BillingCommand,
): Promise<BillingSubmitResult> {
  if (command.screen !== 'invoices' && command.screen !== 'invoice-detail') {
    return { ok: false, formError: 'This screen cannot load invoices.' };
  }
  if (command.action === 'load' && command.screen === 'invoices') {
    const result = await hostApi.request<unknown>({
      path: withQuery(LIST_PATH, {
        page: command.values?.page,
        limit: command.values?.limit,
        from_date: command.values?.from_date,
        to_date: command.values?.to_date,
        payment_method: command.values?.payment_method,
        channel: command.values?.channel,
        q: command.values?.q,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      invoices: asCollection<InvoiceListRow>(result.data, ['invoices']),
      meta: asMeta(result.details),
    };
  }
  if (command.action === 'load' && command.screen === 'invoice-detail') {
    const result = await hostApi.request<unknown>({
      path: invoicePath(command.values.invoiceId),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, invoice: asObject<InvoiceDetail>(result.data) };
  }
  if (command.action === 'exportExcel' && command.screen === 'invoices') {
    const result = await hostApi.request<Blob>({
      path: withQuery(LIST_PATH, {
        export: 'EXCEL',
        from_date: command.values?.from_date,
        to_date: command.values?.to_date,
        payment_method: command.values?.payment_method,
        channel: command.values?.channel,
        q: command.values?.q,
      }),
      method: 'GET',
      binary: true,
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    if (result.data instanceof Blob) {
      downloadBlob(result.data, 'invoices.xlsx');
    }
    return { ok: true, downloaded: true };
  }
  if (command.action === 'pdf') {
    const result = await hostApi.request<Blob>({
      path: withQuery(invoicePath(command.values.invoiceId, '/pdf'), {
        template: command.values.template,
      }),
      method: 'GET',
      binary: true,
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    if (result.data instanceof Blob) {
      downloadBlob(result.data, `invoice-${command.values.invoiceId}.pdf`);
    }
    return { ok: true, downloaded: true };
  }
  if (command.action === 'share' && command.screen === 'invoice-detail') {
    const result = await hostApi.request<unknown>({
      path: invoicePath(command.values.invoiceId, '/share'),
      method: 'POST',
      body: {
        channel: command.values.channel,
        recipient_phone_or_email: command.values.recipient_phone_or_email,
      },
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, share: asObject<InvoiceShareResult>(result.data) };
  }
  return { ok: false, formError: 'This screen cannot load invoices.' };
}
