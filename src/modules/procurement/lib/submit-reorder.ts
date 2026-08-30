import type {
  ProcurementCommand,
  ProcurementSubmitResult,
  PurchaseOrder,
  RecordGrnResult,
  ReorderKpi,
  SuggestionGroup,
} from '@medmate/procurement-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/procurement/lib/errors';
import {
  asCollection,
  asMeta,
  asNested,
  asObject,
  withQuery,
} from '@/modules/procurement/lib/query';

const REORDER_PATH = '/api/v1/pharmacy/reorder';
const PO_PATH = `${REORDER_PATH}/purchase-orders`;

function poPath(poId: string): string {
  return `${PO_PATH}/${encodeURIComponent(poId)}`;
}

export async function submitReorder(
  command: ProcurementCommand,
): Promise<ProcurementSubmitResult> {
  if (command.screen !== 'reorder') {
    return { ok: false, formError: 'This screen cannot manage reorder.' };
  }
  if (command.action === 'load') {
    const result = await hostApi.request<unknown>({
      path: withQuery(REORDER_PATH, {
        group_by: command.values?.group_by,
        page: command.values?.page,
        limit: command.values?.limit,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(
        result.code,
        result.message,
        result.details,
        'reorder',
      );
    }
    return {
      ok: true,
      kpi: asNested<ReorderKpi>(result.data, 'kpi'),
      suggestionGroups: asCollection<SuggestionGroup>(result.data, [
        'suggestion_groups',
      ]),
      meta: asMeta(result.details),
    };
  }
  if (command.action === 'refresh') {
    const result = await hostApi.request<unknown>({
      path: `${REORDER_PATH}/refresh`,
      method: 'POST',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    const payload = asObject<Record<string, unknown>>(result.data);
    return {
      ok: true,
      refreshedAt:
        typeof payload?.last_refreshed_at === 'string'
          ? payload.last_refreshed_at
          : null,
    };
  }
  if (command.action === 'createPo') {
    const result = await hostApi.request<unknown>({
      path: `${REORDER_PATH}/create-po`,
      method: 'POST',
      body: {
        distributor_id: command.values.distributor_id,
        items: command.values.items,
      },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, purchaseOrder: asObject<PurchaseOrder>(result.data) };
  }
  if (command.action === 'loadPurchaseOrders') {
    const result = await hostApi.request<unknown>({
      path: withQuery(PO_PATH, {
        status: command.values?.status,
        page: command.values?.page,
        limit: command.values?.limit,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      purchaseOrders: asCollection<PurchaseOrder>(result.data, [
        'purchase_orders',
      ]),
      meta: asMeta(result.details),
    };
  }
  if (command.action === 'patchPo') {
    const result = await hostApi.request<unknown>({
      path: poPath(command.values.po_id),
      method: 'PATCH',
      body: {
        add_items: command.values.add_items,
        remove_item_ids: command.values.remove_item_ids,
        update_items: command.values.update_items,
      },
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, purchaseOrder: asObject<PurchaseOrder>(result.data) };
  }
  if (command.action === 'send') {
    const result = await hostApi.request<unknown>({
      path: `${poPath(command.values.po_id)}/send`,
      method: 'POST',
      body: { channel: command.values.channel ?? 'WHATSAPP' },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, purchaseOrder: asObject<PurchaseOrder>(result.data) };
  }
  if (command.action !== 'recordGrn') {
    return { ok: false, formError: 'This screen cannot manage reorder.' };
  }
  const result = await hostApi.request<unknown>({
    path: `${poPath(command.values.po_id)}/record-grn`,
    method: 'POST',
    body: {
      invoice_number: command.values.invoice_number,
      invoice_date: command.values.invoice_date,
    },
    idempotencyKey: createIdempotencyKey(),
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  return { ok: true, recordGrn: asObject<RecordGrnResult>(result.data) };
}
