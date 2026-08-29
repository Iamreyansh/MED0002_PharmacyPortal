import type {
  CatalogueCommand,
  CatalogueSearchResult,
  CatalogueSubmitResult,
  PageMeta,
  ScheduleRule,
} from '@medmate/catalogue-contract';
import { hostApi } from '@/modules/api';
import { failureResult } from '@/modules/catalogue/lib/errors';
import { withQuery } from '@/modules/catalogue/lib/query';

const SEARCH_PATH = '/api/v1/pharmacy/catalogue/search';
const SCHEDULE_RULES_PATH = '/api/v1/admin/catalogue/schedule-rules';

function asResults(data: unknown): CatalogueSearchResult[] {
  if (Array.isArray(data)) {
    return data as CatalogueSearchResult[];
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.results)) {
      return record.results as CatalogueSearchResult[];
    }
  }
  return [];
}

function asRules(data: unknown): ScheduleRule[] {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.schedules)) {
      return record.schedules as ScheduleRule[];
    }
  }
  return [];
}

function asMeta(meta: unknown): PageMeta {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return {};
  }
  return meta as PageMeta;
}

export async function submitSearch(
  command: CatalogueCommand,
): Promise<CatalogueSubmitResult> {
  if (command.screen !== 'search') {
    return { ok: false, formError: 'This screen cannot search the catalogue.' };
  }
  if (command.action === 'loadScheduleRules') {
    const result = await hostApi.request<unknown>({
      path: SCHEDULE_RULES_PATH,
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, scheduleRules: asRules(result.data) };
  }
  if (command.action !== 'search') {
    return { ok: false, formError: 'This screen cannot search the catalogue.' };
  }
  const result = await hostApi.request<unknown>({
    path: withQuery(SEARCH_PATH, {
      q: command.values.q,
      source: command.values.source,
      page: command.values.page,
      limit: command.values.limit,
      in_stock_only: command.values.in_stock_only,
      show_oos: command.values.show_oos,
    }),
    method: 'GET',
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  return {
    ok: true,
    results: asResults(result.data),
    meta: asMeta(result.details),
  };
}
