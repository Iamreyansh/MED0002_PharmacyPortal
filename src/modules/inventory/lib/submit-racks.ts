import type {
  InventoryCommand,
  InventorySubmitResult,
  RackLocation,
  UnlocatedProduct,
} from '@medmate/inventory-contract';
import { hostApi } from '@/modules/api';
import { downloadBlob } from '@/modules/inventory/lib/download';
import { failureResult } from '@/modules/inventory/lib/errors';
import { asCollection, asObject } from '@/modules/inventory/lib/query';

const RACKS_PATH = '/api/v1/pharmacy/rack-locations';

function rackPath(rackCode: string): string {
  return `${RACKS_PATH}/${encodeURIComponent(rackCode)}`;
}

export async function submitRacks(
  command: InventoryCommand,
): Promise<InventorySubmitResult> {
  if (command.screen !== 'racks') {
    return { ok: false, formError: 'This screen cannot update racks.' };
  }
  switch (command.action) {
    case 'load': {
      const result = await hostApi.request<unknown>({
        path: RACKS_PATH,
        method: 'GET',
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return {
        ok: true,
        racks: asCollection<RackLocation>(result.data, ['racks']),
      };
    }
    case 'create': {
      const result = await hostApi.request<unknown>({
        path: RACKS_PATH,
        method: 'POST',
        body: {
          rack_code: command.values.rack_code,
          zone_name: command.values.zone_name,
          name: command.values.name,
        },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, rack: asObject<RackLocation>(result.data) };
    }
    case 'loadUnlocated': {
      const result = await hostApi.request<unknown>({
        path: `${RACKS_PATH}/unlocated`,
        method: 'GET',
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return {
        ok: true,
        unlocated: asCollection<UnlocatedProduct>(result.data, ['unlocated']),
      };
    }
    case 'assign': {
      const result = await hostApi.request<unknown>({
        path: `${RACKS_PATH}/assign`,
        method: 'POST',
        body: {
          product_id: command.values.product_id,
          rack_code: command.values.rack_code,
        },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true };
    }
    case 'printLabels': {
      const result = await hostApi.request<Blob>({
        path: `${RACKS_PATH}/print-labels`,
        method: 'POST',
        body: { rack_codes: command.values?.rack_codes },
        binary: true,
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      if (result.data instanceof Blob) {
        downloadBlob(result.data, 'rack-labels.pdf');
      }
      return { ok: true, printed: true, downloaded: true };
    }
    case 'loadOne': {
      const result = await hostApi.request<unknown>({
        path: rackPath(command.values.rack_code),
        method: 'GET',
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, rack: asObject<RackLocation>(result.data) };
    }
    case 'delete': {
      const result = await hostApi.request<unknown>({
        path: rackPath(command.values.rack_code),
        method: 'DELETE',
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, deleted: true };
    }
    default:
      return { ok: false, formError: 'This screen cannot update racks.' };
  }
}
