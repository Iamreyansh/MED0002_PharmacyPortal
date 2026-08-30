import type {
  AccountsGstData,
  AnalyticsCommand,
  AnalyticsOverview,
  AnalyticsQuery,
  AnalyticsReport,
  AnalyticsSubmitResult,
  ProductsAnalyticsData,
  ReportCatalogueRow,
  SalesRegisterData,
} from '@medmate/analytics-contract';
import {
  isAnalyticsReportId,
  normalizeReportId,
} from '@medmate/analytics-contract';
import { hostApi } from '@/modules/api';
import { failureResult } from '@/modules/analytics/lib/errors';
import {
  asCollection,
  asMeta,
  asObject,
  withQuery,
} from '@/modules/analytics/lib/query';

const ANALYTICS_ROOT = '/api/v1/pharmacy/analytics';

function queryParams(query: AnalyticsQuery | undefined) {
  return {
    period: query?.period,
    date_from: query?.date_from,
    date_to: query?.date_to,
    page: query?.page,
    limit: query?.limit,
    channel: query?.channel,
    payment_method: query?.payment_method,
    sort: query?.sort,
    order: query?.order,
    dead_stock_only: query?.dead_stock_only,
  };
}

function invalidReportId(): AnalyticsSubmitResult {
  return {
    ok: false,
    code: 'VALIDATION_ERROR',
    formError: 'This report id is not recognised.',
  };
}

function reportPath(reportId: string): string | null {
  if (!isAnalyticsReportId(reportId)) {
    return null;
  }
  return `${ANALYTICS_ROOT}/reports/${encodeURIComponent(normalizeReportId(reportId))}`;
}

export async function submitAnalytics(
  command: AnalyticsCommand,
): Promise<AnalyticsSubmitResult> {
  if (command.screen !== 'analytics') {
    return { ok: false, formError: 'This screen cannot load analytics.' };
  }

  if (command.action === 'loadOverview') {
    const result = await hostApi.request<unknown>({
      path: withQuery(
        `${ANALYTICS_ROOT}/overview`,
        queryParams(command.values),
      ),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, overview: asObject<AnalyticsOverview>(result.data) };
  }

  if (command.action === 'loadSalesRegister') {
    const result = await hostApi.request<unknown>({
      path: withQuery(
        `${ANALYTICS_ROOT}/sales-register`,
        queryParams(command.values),
      ),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      salesRegister: asObject<SalesRegisterData>(result.data) ?? {
        sales: asCollection(result.data, ['sales', 'items', 'rows']),
      },
      meta: asMeta(result.details),
    };
  }

  if (command.action === 'loadProducts') {
    const result = await hostApi.request<unknown>({
      path: withQuery(
        `${ANALYTICS_ROOT}/products`,
        queryParams(command.values),
      ),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      products: asObject<ProductsAnalyticsData>(result.data) ?? {
        products: asCollection(result.data, ['products', 'items', 'rows']),
      },
      meta: asMeta(result.details),
    };
  }

  if (command.action === 'loadGst') {
    const result = await hostApi.request<unknown>({
      path: withQuery(
        `${ANALYTICS_ROOT}/accounts-gst`,
        queryParams(command.values),
      ),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, gst: asObject<AccountsGstData>(result.data) };
  }

  if (command.action === 'loadCatalogue') {
    const result = await hostApi.request<unknown>({
      path: `${ANALYTICS_ROOT}/reports-catalogue`,
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      reports: asCollection<ReportCatalogueRow>(result.data, [
        'reports',
        'items',
        'rows',
      ]),
    };
  }

  if (command.action === 'loadReport') {
    const path = reportPath(command.values.reportId);
    if (!path) {
      return invalidReportId();
    }
    const result = await hostApi.request<unknown>({
      path: withQuery(path, queryParams(command.values)),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, report: asObject<AnalyticsReport>(result.data) };
  }

  if (command.action === 'favorite') {
    const path = reportPath(command.values.reportId);
    if (!path) {
      return invalidReportId();
    }
    const result = await hostApi.request<unknown>({
      path: `${path}/favorite`,
      method: 'PATCH',
      body: { is_favorite: command.values.is_favorite },
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, report: asObject<AnalyticsReport>(result.data) };
  }

  return { ok: false, formError: 'This screen cannot load analytics.' };
}
