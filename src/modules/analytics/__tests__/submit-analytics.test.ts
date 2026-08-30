import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { hostApi } from '@/modules/api';
import {
  asCollection,
  asMeta,
  asObject,
  withQuery,
} from '@/modules/analytics/lib/query';
import { submitAnalytics } from '@/modules/analytics/lib/submit-analytics';

afterEach(() => {
  vi.restoreAllMocks();
});

function ok<T>(data: T, details?: unknown, status = 200): HostApiResponse<T> {
  return { ok: true, status, data, details };
}

function fail(
  code: string,
  message = code,
  status = 403,
): HostApiResponse<never> {
  return { ok: false, status, data: undefined as never, code, message };
}

describe('analytics query helper', () => {
  it('omits empty values and serializes paging', () => {
    expect(withQuery('/x', { q: '', page: 2, limit: 20 })).toBe(
      '/x?page=2&limit=20',
    );
    expect(withQuery('/x', {})).toBe('/x');
    expect(asMeta(null)).toEqual({});
    expect(asMeta([])).toEqual({});
    expect(asObject(null)).toBeNull();
    expect(asObject([])).toBeNull();
    expect(asObject({ period: '30D' })).toEqual({ period: '30D' });
    expect(asCollection({ sales: [{ sale_id: '1' }] }, ['sales'])).toEqual([
      { sale_id: '1' },
    ]);
    expect(asCollection([{ sale_id: '1' }], ['sales'])).toEqual([
      { sale_id: '1' },
    ]);
    expect(asCollection({ items: [{ sale_id: '2' }] }, ['items'])).toEqual([
      { sale_id: '2' },
    ]);
    expect(asCollection({ nope: 1 }, ['sales'])).toEqual([]);
    expect(asCollection(null, ['sales'])).toEqual([]);
  });
});

describe('submitAnalytics', () => {
  it('loads overview with Core period query', async () => {
    const request = vi.spyOn(hostApi, 'request').mockResolvedValue(
      ok({
        period: 'CUSTOM',
        financials: { net_revenue_paise: 100 },
      }),
    );
    const result = await submitAnalytics({
      screen: 'analytics',
      action: 'loadOverview',
      values: {
        period: 'CUSTOM',
        date_from: '2026-08-01',
        date_to: '2026-08-30',
      },
    });
    expect(result).toMatchObject({
      ok: true,
      overview: { period: 'CUSTOM', financials: { net_revenue_paise: 100 } },
    });
    expect(request).toHaveBeenCalledWith({
      path: '/api/v1/pharmacy/analytics/overview?period=CUSTOM&date_from=2026-08-01&date_to=2026-08-30',
      method: 'GET',
    });
  });

  it('loads sales-register and products with fallback collections', async () => {
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(
        ok(
          { sales: [{ invoice_number: 'INV-1' }], totals: { total_sales: 1 } },
          { page: 2, has_next: true },
        ),
      )
      .mockResolvedValueOnce(ok([{ invoice_number: 'INV-2' }]))
      .mockResolvedValueOnce(ok({ products: [{ name: 'Metformin' }] }))
      .mockResolvedValueOnce(ok([{ name: 'Atorva' }]));
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadSalesRegister',
        values: { period: '30D', page: 2, limit: 20, channel: 'ONLINE' },
      }),
    ).toMatchObject({
      ok: true,
      salesRegister: { sales: [{ invoice_number: 'INV-1' }] },
      meta: { page: 2, has_next: true },
    });
    expect(request).toHaveBeenCalledWith({
      path: '/api/v1/pharmacy/analytics/sales-register?period=30D&page=2&limit=20&channel=ONLINE',
      method: 'GET',
    });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadSalesRegister',
        values: { period: '7D' },
      }),
    ).toMatchObject({
      ok: true,
      salesRegister: { sales: [{ invoice_number: 'INV-2' }] },
    });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadProducts',
        values: { period: '30D', sort: 'revenue', dead_stock_only: true },
      }),
    ).toMatchObject({
      ok: true,
      products: { products: [{ name: 'Metformin' }] },
    });
    expect(request).toHaveBeenCalledWith({
      path: '/api/v1/pharmacy/analytics/products?period=30D&sort=revenue&dead_stock_only=true',
      method: 'GET',
    });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadProducts',
        values: { period: 'FY' },
      }),
    ).toMatchObject({
      ok: true,
      products: { products: [{ name: 'Atorva' }] },
    });
  });

  it('loads GST, catalogue, report, and favorite', async () => {
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValueOnce(ok({ pl_card: { revenue_paise: 10 } }))
      .mockResolvedValueOnce(ok({ reports: [{ report_id: 'DAYBOOK' }] }))
      .mockResolvedValueOnce(
        ok({ report_id: 'DAYBOOK', columns: ['date'], rows: [] }),
      )
      .mockResolvedValueOnce(ok({ report_id: 'DAYBOOK', is_favorite: true }));
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadGst',
        values: { period: 'FY' },
      }),
    ).toMatchObject({ ok: true, gst: { pl_card: { revenue_paise: 10 } } });
    expect(request).toHaveBeenCalledWith({
      path: '/api/v1/pharmacy/analytics/accounts-gst?period=FY',
      method: 'GET',
    });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadCatalogue',
      }),
    ).toMatchObject({ ok: true, reports: [{ report_id: 'DAYBOOK' }] });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadReport',
        values: { reportId: 'daybook', period: '30D' },
      }),
    ).toMatchObject({ ok: true, report: { report_id: 'DAYBOOK' } });
    expect(request).toHaveBeenCalledWith({
      path: '/api/v1/pharmacy/analytics/reports/DAYBOOK?period=30D',
      method: 'GET',
    });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'favorite',
        values: { reportId: 'DAYBOOK', is_favorite: true },
      }),
    ).toMatchObject({ ok: true, report: { is_favorite: true } });
    expect(request).toHaveBeenCalledWith({
      path: '/api/v1/pharmacy/analytics/reports/DAYBOOK/favorite',
      method: 'PATCH',
      body: { is_favorite: true },
    });
  });

  it('rejects unknown report ids and maps Core failures', async () => {
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValue(fail('REPORT_NOT_FOUND', 'Missing', 404));
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadReport',
        values: { reportId: 'nope', period: '30D' },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(request).not.toHaveBeenCalled();
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'favorite',
        values: {
          reportId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          is_favorite: true,
        },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadReport',
        values: { reportId: 'DAYBOOK', period: '30D' },
      }),
    ).toMatchObject({ ok: false, code: 'REPORT_NOT_FOUND' });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadOverview',
      }),
    ).toMatchObject({ ok: false, code: 'REPORT_NOT_FOUND' });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadSalesRegister',
      }),
    ).toMatchObject({ ok: false, code: 'REPORT_NOT_FOUND' });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadProducts',
      }),
    ).toMatchObject({ ok: false, code: 'REPORT_NOT_FOUND' });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadGst',
      }),
    ).toMatchObject({ ok: false, code: 'REPORT_NOT_FOUND' });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'loadCatalogue',
      }),
    ).toMatchObject({ ok: false, code: 'REPORT_NOT_FOUND' });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'favorite',
        values: { reportId: 'DAYBOOK', is_favorite: false },
      }),
    ).toMatchObject({ ok: false, code: 'REPORT_NOT_FOUND' });
    expect(
      await submitAnalytics({
        screen: 'wrong',
        action: 'loadOverview',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitAnalytics({
        screen: 'analytics',
        action: 'export',
      } as never),
    ).toMatchObject({ ok: false });
  });
});
