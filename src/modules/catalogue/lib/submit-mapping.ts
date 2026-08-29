import {
  isUuid,
  type CatalogueCommand,
  type CatalogueMappingRow,
  type CatalogueSubmitResult,
  type PageMeta,
} from '@medmate/catalogue-contract';
import { hostApi } from '@/modules/api';
import { failureResult } from '@/modules/catalogue/lib/errors';
import { withQuery } from '@/modules/catalogue/lib/query';

const MAPPING_PATH = '/api/v1/pharmacy/catalogue-mapping';

function asMappings(data: unknown): CatalogueMappingRow[] {
  if (Array.isArray(data)) {
    return data as CatalogueMappingRow[];
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.mappings)) {
      return record.mappings as CatalogueMappingRow[];
    }
  }
  return [];
}

function asMapping(data: unknown): CatalogueMappingRow | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  return data as CatalogueMappingRow;
}

function asMeta(meta: unknown): PageMeta {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return {};
  }
  return meta as PageMeta;
}

export async function submitMapping(
  command: CatalogueCommand,
): Promise<CatalogueSubmitResult> {
  if (command.screen !== 'mapping') {
    return { ok: false, formError: 'This screen cannot update mappings.' };
  }
  switch (command.action) {
    case 'load': {
      const result = await hostApi.request<unknown>({
        path: withQuery(MAPPING_PATH, {
          page: command.values?.page,
          limit: command.values?.limit,
          search: command.values?.search,
          is_visible: command.values?.is_visible,
          in_stock: command.values?.in_stock,
          sort: command.values?.sort,
          order: command.values?.order,
        }),
        method: 'GET',
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return {
        ok: true,
        mappings: asMappings(result.data),
        meta: asMeta(result.details),
      };
    }
    case 'create': {
      if (!isUuid(command.values.master_medicine_id)) {
        return {
          ok: false,
          code: 'VALIDATION_ERROR',
          fieldErrors: {
            master_medicine_id:
              'Use the UUID from catalogue search. A short code like 1 is not a medicine ID.',
          },
          formError: 'Master medicine ID must be a UUID from catalogue search.',
        };
      }
      const result = await hostApi.request<unknown>({
        path: MAPPING_PATH,
        method: 'POST',
        body: {
          master_medicine_id: command.values.master_medicine_id,
          pharmacy_price: command.values.pharmacy_price,
          stock_quantity: command.values.stock_quantity,
        },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, mapping: asMapping(result.data) };
    }
    case 'update': {
      const result = await hostApi.request<unknown>({
        path: `${MAPPING_PATH}/${command.values.mapping_id}`,
        method: 'PATCH',
        body: {
          pharmacy_price: command.values.pharmacy_price,
          stock_quantity: command.values.stock_quantity,
          is_visible: command.values.is_visible,
        },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, mapping: asMapping(result.data) };
    }
    case 'delete': {
      const result = await hostApi.request<unknown>({
        path: `${MAPPING_PATH}/${command.values.mapping_id}`,
        method: 'DELETE',
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, deleted: true };
    }
    default:
      return { ok: false, formError: 'This screen cannot update mappings.' };
  }
}
