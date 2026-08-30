import type {
  InventoryBatch,
  InventoryCommand,
  InventorySubmitResult,
} from '@medmate/inventory-contract';
import { hostApi } from '@/modules/api';
import { failureResult } from '@/modules/inventory/lib/errors';
import { asCollection } from '@/modules/inventory/lib/query';

const PRODUCT_PATH = '/api/v1/pharmacy/inventory';

function batchesPath(productId: string): string {
  return `${PRODUCT_PATH}/${encodeURIComponent(productId)}/batches`;
}

function batchPath(productId: string, batchId: string): string {
  return `${batchesPath(productId)}/${encodeURIComponent(batchId)}`;
}

export async function submitBatches(
  command: InventoryCommand,
): Promise<InventorySubmitResult> {
  if (command.screen !== 'detail') {
    return { ok: false, formError: 'This screen cannot update batches.' };
  }
  switch (command.action) {
    case 'loadBatches': {
      const result = await hostApi.request<unknown>({
        path: batchesPath(command.values.product_id),
        method: 'GET',
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return {
        ok: true,
        batches: asCollection<InventoryBatch>(result.data, ['batches']),
      };
    }
    case 'addBatch': {
      const result = await hostApi.request<unknown>({
        path: batchesPath(command.values.product_id),
        method: 'POST',
        body: {
          batch_number: command.values.batch_number,
          expiry_date: command.values.expiry_date,
          quantity: command.values.quantity,
        },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return {
        ok: true,
        batches: asCollection<InventoryBatch>(result.data, ['batches']),
      };
    }
    case 'adjustBatch': {
      const result = await hostApi.request<unknown>({
        path: batchPath(command.values.product_id, command.values.batch_id),
        method: 'PATCH',
        body: { quantity: command.values.quantity },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return {
        ok: true,
        batches: asCollection<InventoryBatch>(result.data, ['batches']),
      };
    }
    case 'writeOff': {
      const result = await hostApi.request<unknown>({
        path: batchPath(command.values.product_id, command.values.batch_id),
        method: 'DELETE',
        body: {
          quantity: command.values.quantity,
          reason: command.values.reason,
        },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, deleted: true };
    }
    default:
      return { ok: false, formError: 'This screen cannot update batches.' };
  }
}
