import type {
  Distributor,
  DistributorKpi,
  PriceCompareRow,
  ProcurementCommand,
  ProcurementSubmitResult,
  SupplyItem,
} from '@medmate/procurement-contract';
import { hostApi } from '@/modules/api';
import { failureResult } from '@/modules/procurement/lib/errors';
import {
  asCollection,
  asMeta,
  asNested,
  asObject,
  withQuery,
} from '@/modules/procurement/lib/query';

const LIST_PATH = '/api/v1/pharmacy/distributors';

function distPath(id: string): string {
  return `${LIST_PATH}/${encodeURIComponent(id)}`;
}

export async function submitDistributors(
  command: ProcurementCommand,
): Promise<ProcurementSubmitResult> {
  if (command.screen !== 'distributors') {
    return { ok: false, formError: 'This screen cannot manage distributors.' };
  }
  if (command.action === 'load') {
    const result = await hostApi.request<unknown>({
      path: withQuery(LIST_PATH, {
        page: command.values?.page,
        limit: command.values?.limit,
        is_active: command.values?.is_active,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(
        result.code,
        result.message,
        result.details,
        'distributors',
      );
    }
    return {
      ok: true,
      kpi: asNested<DistributorKpi>(result.data, 'kpi'),
      distributors: asCollection<Distributor>(result.data, ['distributors']),
      meta: asMeta(result.details),
    };
  }
  if (command.action === 'create') {
    const result = await hostApi.request<unknown>({
      path: LIST_PATH,
      method: 'POST',
      body: command.values,
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, distributor: asObject<Distributor>(result.data) };
  }
  if (command.action === 'patch') {
    const result = await hostApi.request<unknown>({
      path: distPath(command.values.id ?? ''),
      method: 'PATCH',
      body: command.values,
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, distributor: asObject<Distributor>(result.data) };
  }
  if (command.action === 'delete') {
    const result = await hostApi.request<unknown>({
      path: distPath(command.values.id),
      method: 'DELETE',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, deleted: true };
  }
  if (command.action === 'loadSupply') {
    const result = await hostApi.request<unknown>({
      path: withQuery(`${distPath(command.values.id)}/supply-list`, {
        page: command.values.page,
        limit: command.values.limit,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      supplyItems: asCollection<SupplyItem>(result.data, ['supply_items']),
    };
  }
  if (command.action === 'setPreferred') {
    const result = await hostApi.request<unknown>({
      path: `${distPath(command.values.id)}/supply-list/${encodeURIComponent(command.values.product_id)}/set-preferred`,
      method: 'PATCH',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      supplyItems: asCollection<SupplyItem>(result.data, ['supply_items']),
    };
  }
  if (command.action !== 'loadPriceCompare') {
    return { ok: false, formError: 'This screen cannot manage distributors.' };
  }
  const result = await hostApi.request<unknown>({
    path: withQuery(`${LIST_PATH}/price-compare`, {
      only_multi_source: command.values?.only_multi_source,
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
    compare: asCollection<PriceCompareRow>(result.data, [
      'products',
      'compare',
    ]),
  };
}
