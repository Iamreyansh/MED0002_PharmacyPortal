import type {
  InventoryCommand,
  InventorySubmitResult,
  RackLocation,
  UnlocatedProduct,
} from '@medmate/inventory-contract';
import { hostApi } from '@/modules/api';
import {
  downloadBlob,
  downloadDataUrl,
} from '@/modules/inventory/lib/download';
import { failureResult } from '@/modules/inventory/lib/errors';
import { asCollection, asObject } from '@/modules/inventory/lib/query';

const RACKS_PATH = '/api/v1/pharmacy/rack-locations';

function rackPath(rackCode: string): string {
  return `${RACKS_PATH}/${encodeURIComponent(rackCode)}`;
}

function asRack(row: RackLocation): RackLocation {
  return {
    ...row,
    name: row.name ?? row.description ?? null,
    description: row.description ?? row.name ?? null,
    product_count: row.product_count ?? row.medicine_count ?? null,
    medicine_count: row.medicine_count ?? row.product_count ?? null,
  };
}

function asRacks(data: unknown): RackLocation[] {
  return asCollection<RackLocation>(data, ['racks']).map(asRack);
}

function printPdfUrl(data: unknown): string | null {
  if (typeof data === 'string' && data.startsWith('data:')) {
    return data;
  }
  const row = asObject<Record<string, unknown>>(data);
  if (typeof row?.pdf_url === 'string') {
    return row.pdf_url;
  }
  return null;
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
        racks: asRacks(result.data),
      };
    }
    case 'create': {
      const result = await hostApi.request<unknown>({
        path: RACKS_PATH,
        method: 'POST',
        body: {
          rack_code: command.values.rack_code,
          zone_name: command.values.zone_name,
          description: command.values.description ?? command.values.name,
        },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      const rack = asObject<RackLocation>(result.data);
      return { ok: true, rack: rack ? asRack(rack) : null };
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
        unlocated: asCollection<UnlocatedProduct>(result.data, [
          'products',
          'unlocated',
        ]),
      };
    }
    case 'assign': {
      const result = await hostApi.request<unknown>({
        path: `${RACKS_PATH}/assign`,
        method: 'POST',
        body: {
          product_ids: [command.values.product_id],
          rack_code: command.values.rack_code,
        },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true };
    }
    case 'printLabels': {
      const result = await hostApi.request<unknown>({
        path: `${RACKS_PATH}/print-labels`,
        method: 'POST',
        body: { rack_codes: command.values?.rack_codes },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      const pdfUrl = printPdfUrl(result.data);
      const downloaded = pdfUrl
        ? downloadDataUrl(pdfUrl, 'rack-labels.pdf')
        : result.data instanceof Blob
          ? downloadBlob(result.data, 'rack-labels.pdf')
          : false;
      if (!downloaded) {
        return { ok: false, formError: 'Could not download labels.' };
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
      const rack = asObject<RackLocation>(result.data);
      return { ok: true, rack: rack ? asRack(rack) : null };
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
