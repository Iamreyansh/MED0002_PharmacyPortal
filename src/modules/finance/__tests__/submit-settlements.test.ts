import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { hostApi } from '@/modules/api';
import {
  asCollection,
  asMeta,
  asObject,
  withQuery,
} from '@/modules/finance/lib/query';
import { submitSettlements } from '@/modules/finance/lib/submit-settlements';

const SETTLEMENT_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

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

describe('finance query helper', () => {
  it('omits empty values and serializes paging', () => {
    expect(withQuery('/x', { q: '', page: 2, limit: 20 })).toBe(
      '/x?page=2&limit=20',
    );
    expect(withQuery('/x', {})).toBe('/x');
    expect(asMeta(null)).toEqual({});
    expect(asMeta([])).toEqual({});
    expect(asObject(null)).toBeNull();
    expect(asObject([])).toBeNull();
    expect(asObject({ settlement_id: '1' })).toEqual({ settlement_id: '1' });
    expect(
      asCollection({ settlements: [{ settlement_id: '1' }] }, ['settlements']),
    ).toEqual([{ settlement_id: '1' }]);
    expect(asCollection([{ settlement_id: '1' }], ['settlements'])).toEqual([
      { settlement_id: '1' },
    ]);
    expect(
      asCollection({ items: [{ settlement_id: '2' }] }, ['items']),
    ).toEqual([{ settlement_id: '2' }]);
    expect(asCollection({ nope: 1 }, ['settlements'])).toEqual([]);
    expect(asCollection(null, ['settlements'])).toEqual([]);
  });
});

describe('submitSettlements', () => {
  it('loads a paginated list', async () => {
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValue(
        ok(
          { settlements: [{ settlement_id: SETTLEMENT_ID }] },
          { has_next: true },
        ),
      );
    const result = await submitSettlements({
      screen: 'settlements',
      action: 'load',
      values: { page: 2, limit: 20 },
    });
    expect(result).toMatchObject({
      ok: true,
      settlements: [{ settlement_id: SETTLEMENT_ID }],
      meta: { has_next: true },
    });
    expect(request).toHaveBeenCalledWith({
      path: '/api/v1/pharmacy/finance/settlements?page=2&limit=20',
      method: 'GET',
    });
  });

  it('loads detail and rejects invalid ids', async () => {
    const request = vi
      .spyOn(hostApi, 'request')
      .mockResolvedValue(
        ok({ settlement_id: SETTLEMENT_ID, net_payable: 100 }),
      );
    expect(
      await submitSettlements({
        screen: 'settlement-detail',
        action: 'load',
        values: { settlementId: SETTLEMENT_ID },
      }),
    ).toMatchObject({
      ok: true,
      settlement: { settlement_id: SETTLEMENT_ID, net_payable: 100 },
    });
    expect(request).toHaveBeenCalledWith({
      path: `/api/v1/pharmacy/finance/settlements/${SETTLEMENT_ID}`,
      method: 'GET',
    });
    request.mockClear();
    expect(
      await submitSettlements({
        screen: 'settlement-detail',
        action: 'load',
        values: { settlementId: 'nope' },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(request).not.toHaveBeenCalled();
  });

  it('maps Core failures and mismatched commands', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValue(
      fail('SETTLEMENT_NOT_FOUND', 'Missing', 404),
    );
    expect(
      await submitSettlements({
        screen: 'settlement-detail',
        action: 'load',
        values: { settlementId: SETTLEMENT_ID },
      }),
    ).toMatchObject({ ok: false, code: 'SETTLEMENT_NOT_FOUND' });
    expect(
      await submitSettlements({
        screen: 'settlements',
        action: 'load',
      }),
    ).toMatchObject({ ok: false, code: 'SETTLEMENT_NOT_FOUND' });
    expect(
      await submitSettlements({
        screen: 'settlements',
        action: 'quote',
      } as never),
    ).toMatchObject({ ok: false });
  });
});
