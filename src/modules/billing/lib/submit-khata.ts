import type {
  BillingCommand,
  BillingSubmitResult,
  KhataAging,
  KhataCustomerRow,
  KhataDetail,
  KhataKpi,
  KhataPaymentRow,
  KhataRemindResult,
  KhataRepaymentResult,
} from '@medmate/billing-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { downloadBlob } from '@/modules/billing/lib/download';
import { failureResult } from '@/modules/billing/lib/errors';
import {
  asCollection,
  asMeta,
  asNested,
  asObject,
  withQuery,
} from '@/modules/billing/lib/query';

const LIST_PATH = '/api/v1/pharmacy/khata';

export async function submitKhata(
  command: BillingCommand,
): Promise<BillingSubmitResult> {
  if (command.screen !== 'khata' && command.screen !== 'khata-detail') {
    return { ok: false, formError: 'This screen cannot load khata.' };
  }
  if (command.action === 'load' && command.screen === 'khata') {
    const result = await hostApi.request<unknown>({
      path: withQuery(LIST_PATH, {
        page: command.values?.page,
        limit: command.values?.limit,
        overdue_only: command.values?.overdue_only,
        sort: command.values?.sort,
        q: command.values?.q,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      customers: asCollection<KhataCustomerRow>(result.data, ['customers']),
      kpi: asNested<KhataKpi>(result.data, 'kpi'),
      aging: asNested<KhataAging>(result.data, 'aging_chart'),
      meta: asMeta(result.details),
    };
  }
  if (command.action === 'loadHistory' && command.screen === 'khata') {
    const result = await hostApi.request<unknown>({
      path: withQuery(`${LIST_PATH}/payment-history`, {
        page: command.values?.page,
        limit: command.values?.limit,
        from_date: command.values?.from_date,
        to_date: command.values?.to_date,
        payment_mode: command.values?.payment_mode,
        q: command.values?.q,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    const data = asObject<Record<string, unknown>>(result.data);
    return {
      ok: true,
      repayments: asCollection<KhataPaymentRow>(result.data, ['repayments']),
      period_total_collected:
        typeof data?.period_total_collected === 'number'
          ? data.period_total_collected
          : null,
      meta: asMeta(result.details),
    };
  }
  if (command.action === 'exportExcel' && command.screen === 'khata') {
    const result = await hostApi.request<Blob>({
      path: withQuery(`${LIST_PATH}/payment-history`, {
        export: 'EXCEL',
        from_date: command.values?.from_date,
        to_date: command.values?.to_date,
        payment_mode: command.values?.payment_mode,
        q: command.values?.q,
      }),
      method: 'GET',
      binary: true,
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    if (result.data instanceof Blob) {
      downloadBlob(result.data, 'khata-payments.xlsx');
    }
    return { ok: true, downloaded: true };
  }
  if (command.action === 'load' && command.screen === 'khata-detail') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${command.values.customerId}`,
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, khata: asObject<KhataDetail>(result.data) };
  }
  if (command.action === 'repay' && command.screen === 'khata-detail') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${command.values.customerId}/repayment`,
      method: 'POST',
      body: {
        amount: command.values.amount,
        payment_mode: command.values.payment_mode,
        note: command.values.note,
        reference_number: command.values.reference_number,
      },
      idempotencyKey: command.values.idempotencyKey ?? createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      repayment: asObject<KhataRepaymentResult>(result.data),
    };
  }
  if (command.action === 'remind' && command.screen === 'khata-detail') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${command.values.customerId}/remind`,
      method: 'POST',
      body: {
        channel: command.values.channel,
        message_template: command.values.message_template,
      },
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, remind: asObject<KhataRemindResult>(result.data) };
  }
  return { ok: false, formError: 'This screen cannot load khata.' };
}
