import type {
  GrnDetail,
  GrnItem,
  GrnStockResult,
  ProcurementCommand,
  ProcurementSubmitResult,
} from '@medmate/procurement-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/procurement/lib/errors';
import { asObject } from '@/modules/procurement/lib/query';

const LIST_PATH = '/api/v1/pharmacy/purchases';

function grnPath(grnId: string): string {
  return `${LIST_PATH}/${encodeURIComponent(grnId)}`;
}

function itemPath(grnId: string, itemId: string): string {
  return `${grnPath(grnId)}/items/${encodeURIComponent(itemId)}`;
}

export async function submitEditor(
  command: ProcurementCommand,
): Promise<ProcurementSubmitResult> {
  if (command.screen !== 'editor') {
    return { ok: false, formError: 'This screen cannot edit a receipt.' };
  }
  if (command.action === 'load') {
    const result = await hostApi.request<unknown>({
      path: grnPath(command.values.grn_id),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, grn: asObject<GrnDetail>(result.data) };
  }
  if (command.action === 'addItem') {
    const result = await hostApi.request<unknown>({
      path: `${grnPath(command.values.grn_id)}/items`,
      method: 'POST',
      body: {
        product_id: command.values.product_id,
        batch_number: command.values.batch_number,
        expiry_date: command.values.expiry_date,
        quantity: command.values.quantity,
        free_quantity: command.values.free_quantity,
        purchase_price_per_unit: command.values.purchase_price_per_unit,
        mrp_per_unit: command.values.mrp_per_unit,
        gst_pct: command.values.gst_pct,
      },
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, item: asObject<GrnItem>(result.data) };
  }
  if (command.action === 'patchItem') {
    const result = await hostApi.request<unknown>({
      path: itemPath(command.values.grn_id, command.values.item_id),
      method: 'PATCH',
      body: { quantity: command.values.quantity },
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, item: asObject<GrnItem>(result.data) };
  }
  if (command.action === 'deleteItem') {
    const result = await hostApi.request<unknown>({
      path: itemPath(command.values.grn_id, command.values.item_id),
      method: 'DELETE',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, deleted: true };
  }
  if (command.action !== 'saveAndStock') {
    return { ok: false, formError: 'This screen cannot edit a receipt.' };
  }
  const result = await hostApi.request<unknown>({
    path: `${grnPath(command.values.grn_id)}/save-and-stock`,
    method: 'POST',
    idempotencyKey: createIdempotencyKey(),
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  return { ok: true, grn: asObject<GrnStockResult>(result.data) };
}
