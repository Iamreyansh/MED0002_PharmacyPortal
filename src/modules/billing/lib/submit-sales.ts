import type {
  BillingCommand,
  BillingSubmitResult,
  MarkPaidResult,
  SaleDetail,
  SalesListRow,
  SalesPeriodSummary,
  SalesSummary,
} from '@medmate/billing-contract';
import { hostApi } from '@/modules/api';
import { downloadBlob } from '@/modules/billing/lib/download';
import { failureResult } from '@/modules/billing/lib/errors';
import {
  asCollection,
  asNested,
  asObject,
  asMeta,
  withQuery,
} from '@/modules/billing/lib/query';

const LIST_PATH = '/api/v1/pharmacy/sales';

export async function submitSales(
  command: BillingCommand,
): Promise<BillingSubmitResult> {
  if (command.screen !== 'sales') {
    return { ok: false, formError: 'This screen cannot load sales.' };
  }
  if (command.action === 'load') {
    const result = await hostApi.request<unknown>({
      path: withQuery(LIST_PATH, {
        page: command.values?.page,
        limit: command.values?.limit,
        from_date: command.values?.from_date,
        to_date: command.values?.to_date,
        channel: command.values?.channel,
        payment_method: command.values?.payment_method,
        payment_status: command.values?.payment_status,
        q: command.values?.q,
        sort: command.values?.sort,
        order: command.values?.order,
        financial_year: command.values?.financial_year,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      sales: asCollection<SalesListRow>(result.data, ['sales']),
      period_summary: asNested<SalesPeriodSummary>(
        result.data,
        'period_summary',
      ),
      meta: asMeta(result.details),
    };
  }
  if (command.action === 'loadSummary') {
    const result = await hostApi.request<unknown>({
      path: withQuery(`${LIST_PATH}/summary`, {
        from_date: command.values?.from_date,
        to_date: command.values?.to_date,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, summary: asObject<SalesSummary>(result.data) };
  }
  if (command.action === 'loadSale') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${command.values.saleId}`,
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, sale: asObject<SaleDetail>(result.data) };
  }
  if (command.action === 'exportExcel') {
    const result = await hostApi.request<Blob>({
      path: withQuery(LIST_PATH, {
        export: 'EXCEL',
        from_date: command.values?.from_date,
        to_date: command.values?.to_date,
        channel: command.values?.channel,
        payment_method: command.values?.payment_method,
        payment_status: command.values?.payment_status,
        q: command.values?.q,
        financial_year: command.values?.financial_year,
      }),
      method: 'GET',
      binary: true,
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    if (result.data instanceof Blob) {
      downloadBlob(result.data, 'sales.xlsx');
    }
    return { ok: true, downloaded: true };
  }
  if (command.action === 'markPaid') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${command.values.saleId}/mark-paid`,
      method: 'POST',
      body: {
        payment_mode: command.values.payment_mode,
        amount: command.values.amount,
        reference_number: command.values.reference_number,
        note: command.values.note,
      },
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, markPaid: asObject<MarkPaidResult>(result.data) };
  }
  return { ok: false, formError: 'This screen cannot load sales.' };
}
