import type {
  InventoryCommand,
  InventoryProduct,
  InventorySubmitResult,
  InventorySummary,
} from '@medmate/inventory-contract';
import { hostApi } from '@/modules/api';
import { downloadBlob } from '@/modules/inventory/lib/download';
import { failureResult } from '@/modules/inventory/lib/errors';
import {
  asCollection,
  asMeta,
  asObject,
  withQuery,
} from '@/modules/inventory/lib/query';

const LIST_PATH = '/api/v1/pharmacy/inventory';
const SUMMARY_PATH = '/api/v1/pharmacy/inventory/summary';

function asSummary(data: unknown): InventorySummary | null {
  const row = asObject<Record<string, unknown>>(data);
  if (!row) {
    return null;
  }
  if (
    row.summary &&
    typeof row.summary === 'object' &&
    !Array.isArray(row.summary)
  ) {
    return row.summary as InventorySummary;
  }
  return row as InventorySummary;
}

export async function submitList(
  command: InventoryCommand,
): Promise<InventorySubmitResult> {
  if (command.screen !== 'list') {
    return { ok: false, formError: 'This screen cannot load inventory.' };
  }
  if (command.action === 'loadSummary') {
    const result = await hostApi.request<unknown>({
      path: SUMMARY_PATH,
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, summary: asSummary(result.data) };
  }
  if (command.action === 'export') {
    const result = await hostApi.request<Blob>({
      path: withQuery(LIST_PATH, { format: command.values?.format ?? 'xlsx' }),
      method: 'GET',
      binary: true,
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    if (result.data instanceof Blob) {
      downloadBlob(result.data, 'inventory.xlsx');
    }
    return { ok: true, downloaded: true };
  }
  if (command.action !== 'load') {
    return { ok: false, formError: 'This screen cannot load inventory.' };
  }
  const result = await hostApi.request<unknown>({
    path: withQuery(LIST_PATH, {
      page: command.values?.page,
      limit: command.values?.limit,
      search: command.values?.search,
    }),
    method: 'GET',
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  return {
    ok: true,
    products: asCollection<InventoryProduct>(result.data, ['products']),
    meta: asMeta(result.details),
  };
}
