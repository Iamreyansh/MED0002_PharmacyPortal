import type {
  InventoryCommand,
  InventoryProduct,
  InventorySubmitResult,
} from '@medmate/inventory-contract';
import { hostApi } from '@/modules/api';
import { failureResult } from '@/modules/inventory/lib/errors';
import { asObject } from '@/modules/inventory/lib/query';

const PRODUCT_PATH = '/api/v1/pharmacy/inventory';

function productPath(productId: string): string {
  return `${PRODUCT_PATH}/${encodeURIComponent(productId)}`;
}

export async function submitProduct(
  command: InventoryCommand,
): Promise<InventorySubmitResult> {
  if (command.screen !== 'detail') {
    return { ok: false, formError: 'This screen cannot update a product.' };
  }
  switch (command.action) {
    case 'load': {
      const result = await hostApi.request<unknown>({
        path: productPath(command.values.product_id),
        method: 'GET',
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, product: asObject<InventoryProduct>(result.data) };
    }
    case 'patchProduct': {
      const result = await hostApi.request<unknown>({
        path: productPath(command.values.product_id),
        method: 'PATCH',
        body: {
          is_online_visible: command.values.is_online_visible,
          rack_location_code: command.values.rack_location_code,
          allow_loose_selling: command.values.allow_loose_selling,
          reorder_level: command.values.reorder_level,
        },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, product: asObject<InventoryProduct>(result.data) };
    }
    case 'patchDetails': {
      const result = await hostApi.request<unknown>({
        path: `${productPath(command.values.product_id)}/details`,
        method: 'PATCH',
        body: {
          allow_loose_selling: command.values.allow_loose_selling,
          reorder_level: command.values.reorder_level,
        },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, product: asObject<InventoryProduct>(result.data) };
    }
    case 'patchRack': {
      const result = await hostApi.request<unknown>({
        path: `${productPath(command.values.product_id)}/rack`,
        method: 'PATCH',
        body: { rack_location_code: command.values.rack_location_code },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, product: asObject<InventoryProduct>(result.data) };
    }
    default:
      return { ok: false, formError: 'This screen cannot update a product.' };
  }
}
