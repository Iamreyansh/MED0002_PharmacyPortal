import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { hostApi } from '@/modules/api';
import { withQuery } from '@/modules/catalogue/lib/query';
import { submitMapping } from '@/modules/catalogue/lib/submit-mapping';
import { submitSearch } from '@/modules/catalogue/lib/submit-search';

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

describe('catalogue query helper', () => {
  it('omits empty values and serializes flags', () => {
    expect(withQuery('/x', { q: '', page: 1, show_oos: true })).toBe(
      '/x?page=1&show_oos=true',
    );
    expect(withQuery('/x', {})).toBe('/x');
  });
});

describe('catalogue submitters', () => {
  it('rejects mismatched commands', async () => {
    expect(
      await submitSearch({ screen: 'mapping', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitMapping({ screen: 'search', action: 'loadScheduleRules' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitSearch({
        screen: 'search',
        action: 'create',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitMapping({
        screen: 'mapping',
        action: 'search',
      } as never),
    ).toMatchObject({ ok: false });
  });

  it('searches and loads schedule rules', async () => {
    const request = vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok(
        {
          results: [{ medicine_id: 'm1', name: 'Crocin' }],
        },
        { page: 1, has_next: false },
      ),
    );
    expect(
      await submitSearch({
        screen: 'search',
        action: 'search',
        values: { q: 'crocin', page: 1, source: 'ALL' },
      }),
    ).toMatchObject({
      ok: true,
      results: [{ medicine_id: 'm1' }],
      meta: { page: 1 },
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/pharmacy/catalogue/search?q=crocin&source=ALL&page=1',
      }),
    );

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok([{ medicine_id: 'm2', name: 'Augmentin' }]),
    );
    expect(
      await submitSearch({
        screen: 'search',
        action: 'search',
        values: { q: 'aug' },
      }),
    ).toMatchObject({ ok: true, results: [{ medicine_id: 'm2' }], meta: {} });

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}, []));
    expect(
      await submitSearch({
        screen: 'search',
        action: 'search',
        values: { q: 'none' },
      }),
    ).toMatchObject({ ok: true, results: [], meta: {} });

    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ schedules: [{ schedule: 'H', full_name: 'Schedule H' }] }),
    );
    expect(
      await submitSearch({ screen: 'search', action: 'loadScheduleRules' }),
    ).toMatchObject({
      ok: true,
      scheduleRules: [{ schedule: 'H' }],
    });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(null as never));
    expect(
      await submitSearch({ screen: 'search', action: 'loadScheduleRules' }),
    ).toMatchObject({ ok: true, scheduleRules: [] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('QUERY_TOO_SHORT'));
    expect(
      await submitSearch({
        screen: 'search',
        action: 'search',
        values: { q: 'x' },
      }),
    ).toMatchObject({ ok: false, code: 'QUERY_TOO_SHORT' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitSearch({ screen: 'search', action: 'loadScheduleRules' }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });

  it('loads and mutates mappings', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok(
        { mappings: [{ mapping_id: 'map-1', master_medicine_id: 'm1' }] },
        { page: 1, has_next: true },
      ),
    );
    expect(
      await submitMapping({
        screen: 'mapping',
        action: 'load',
        values: { page: 1, sort: 'name', order: 'asc' },
      }),
    ).toMatchObject({
      ok: true,
      mappings: [{ mapping_id: 'map-1' }],
      meta: { has_next: true },
    });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok([{ mapping_id: 'map-2', master_medicine_id: 'm2' }]),
    );
    expect(
      await submitMapping({ screen: 'mapping', action: 'load' }),
    ).toMatchObject({ ok: true, mappings: [{ mapping_id: 'map-2' }] });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({}));
    expect(
      await submitMapping({ screen: 'mapping', action: 'load' }),
    ).toMatchObject({ ok: true, mappings: [], meta: {} });

    expect(
      await submitMapping({
        screen: 'mapping',
        action: 'create',
        values: {
          master_medicine_id: '1',
          pharmacy_price: 10,
          stock_quantity: 200,
        },
      }),
    ).toMatchObject({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { master_medicine_id: expect.stringMatching(/UUID/) },
    });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      ok({ mapping_id: 'map-3', master_medicine_id: 'm3' }),
    );
    expect(
      await submitMapping({
        screen: 'mapping',
        action: 'create',
        values: {
          master_medicine_id: '11111111-2222-4333-8444-555555555555',
          pharmacy_price: 20,
          stock_quantity: 2,
        },
      }),
    ).toMatchObject({ ok: true, mapping: { mapping_id: 'map-3' } });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok(null as never));
    expect(
      await submitMapping({
        screen: 'mapping',
        action: 'update',
        values: { mapping_id: 'map-3', pharmacy_price: 19, is_visible: false },
      }),
    ).toMatchObject({ ok: true, mapping: null });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(ok({ deleted: true }));
    expect(
      await submitMapping({
        screen: 'mapping',
        action: 'delete',
        values: { mapping_id: 'map-3' },
      }),
    ).toMatchObject({ ok: true, deleted: true });
  });

  it('maps mapping failures', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('UNAUTHORIZED'));
    expect(
      await submitMapping({ screen: 'mapping', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('PRICE_ABOVE_MRP'));
    expect(
      await submitMapping({
        screen: 'mapping',
        action: 'create',
        values: {
          master_medicine_id: '11111111-2222-4333-8444-555555555555',
          pharmacy_price: 999,
          stock_quantity: 1,
        },
      }),
    ).toMatchObject({ ok: false, code: 'PRICE_ABOVE_MRP' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(
      fail('SCHEDULE_X_NOT_AVAILABLE_ONLINE'),
    );
    expect(
      await submitMapping({
        screen: 'mapping',
        action: 'update',
        values: { mapping_id: 'map-1', is_visible: true },
      }),
    ).toMatchObject({ ok: false, code: 'SCHEDULE_X_NOT_AVAILABLE_ONLINE' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce(fail('FORBIDDEN'));
    expect(
      await submitMapping({
        screen: 'mapping',
        action: 'delete',
        values: { mapping_id: 'map-1' },
      }),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });
});
