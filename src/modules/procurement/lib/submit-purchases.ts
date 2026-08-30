import type {
  CsvImportPreview,
  GrnListRow,
  ProcurementCommand,
  ProcurementSubmitResult,
  PurchaseKpi,
} from '@medmate/procurement-contract';
import { isCsvTooLarge } from '@medmate/procurement-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/procurement/lib/errors';
import {
  asCollection,
  asNested,
  asObject,
  asMeta,
  withQuery,
} from '@/modules/procurement/lib/query';

const LIST_PATH = '/api/v1/pharmacy/purchases';

export async function submitPurchases(
  command: ProcurementCommand,
): Promise<ProcurementSubmitResult> {
  if (command.screen !== 'purchases') {
    return { ok: false, formError: 'This screen cannot load purchases.' };
  }
  if (command.action === 'load') {
    const result = await hostApi.request<unknown>({
      path: withQuery(LIST_PATH, {
        page: command.values?.page,
        limit: command.values?.limit,
        status: command.values?.status,
        q: command.values?.q,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      kpi: asNested<PurchaseKpi>(result.data, 'kpi'),
      grns: asCollection<GrnListRow>(result.data, ['grns']),
      meta: asMeta(result.details),
    };
  }
  if (command.action === 'create') {
    const result = await hostApi.request<unknown>({
      path: LIST_PATH,
      method: 'POST',
      body: {
        distributor_id: command.values.distributor_id,
        invoice_number: command.values.invoice_number,
        invoice_date: command.values.invoice_date,
      },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, grn: asObject<GrnListRow>(result.data) };
  }
  if (command.action === 'importCsv') {
    if (isCsvTooLarge(command.values.file)) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        formError: 'File must be 10MB or smaller.',
      };
    }
    const form = new FormData();
    form.append('csv_file', command.values.file, command.values.file.name);
    form.append('distributor_id', command.values.distributor_id);
    form.append('invoice_number', command.values.invoice_number);
    form.append('invoice_date', command.values.invoice_date);
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/import-csv`,
      method: 'POST',
      body: form,
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, importPreview: asObject<CsvImportPreview>(result.data) };
  }
  if (command.action !== 'confirmImport') {
    return { ok: false, formError: 'This screen cannot load purchases.' };
  }
  const result = await hostApi.request<unknown>({
    path: `${LIST_PATH}/${encodeURIComponent(command.values.grn_id)}/confirm-import`,
    method: 'POST',
    idempotencyKey: createIdempotencyKey(),
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  const payload = asObject<Record<string, unknown>>(result.data);
  return {
    ok: true,
    itemsCreated:
      typeof payload?.items_created === 'number' ? payload.items_created : null,
    grn: asObject(result.data),
  };
}
