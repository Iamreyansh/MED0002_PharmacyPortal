import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { hostApi } from '@/modules/api';
import {
  asCollection,
  asMeta,
  asObject,
  withQuery,
} from '@/modules/orders/lib/query';
import { submitOrders } from '@/modules/orders/lib/submit-orders';
import { submitRxQuotes } from '@/modules/orders/lib/submit-rx-quotes';

const ORDER_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const RIDER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

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

describe('orders query helper', () => {
  it('omits empty values and serializes paging', () => {
    expect(withQuery('/x', { q: '', page: 2, limit: 20 })).toBe(
      '/x?page=2&limit=20',
    );
    expect(withQuery('/x', {})).toBe('/x');
    expect(asMeta(null)).toEqual({});
    expect(asMeta([])).toEqual({});
    expect(asObject(null)).toBeNull();
    expect(asObject([])).toBeNull();
    expect(asObject({ quote_id: '1' })).toEqual({ quote_id: '1' });
    expect(asCollection({ quotes: [{ quote_id: '1' }] }, ['quotes'])).toEqual([
      { quote_id: '1' },
    ]);
    expect(asCollection([{ quote_id: '1' }], ['quotes'])).toEqual([
      { quote_id: '1' },
    ]);
    expect(asCollection({ nope: 1 }, ['quotes'])).toEqual([]);
    expect(asCollection(null, ['quotes'])).toEqual([]);
  });
});

describe('orders submitters', () => {
  it('rejects mismatched commands', async () => {
    expect(
      await submitRxQuotes({
        screen: 'order-actions',
        action: 'accept',
        values: { orderId: ORDER_ID },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitOrders({ screen: 'rx-quotes', action: 'load' }),
    ).toMatchObject({ ok: false });
    expect(
      await submitRxQuotes({
        screen: 'rx-quotes',
        action: 'accept',
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitOrders({
        screen: 'order-actions',
        action: 'load',
        values: { orderId: ORDER_ID },
      } as never),
    ).toMatchObject({ ok: false });
    expect(
      await submitOrders({ screen: 'orders-home', action: 'noop' }),
    ).toEqual({ ok: true });
  });

  it('loads quotes and posts quote or decline', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(
      ok({ quotes: [{ quote_id: 'q-1' }] }, { page: 1 }),
    );
    expect(
      await submitRxQuotes({
        screen: 'rx-quotes',
        action: 'load',
        values: { page: 1, status: 'NOTIFIED' },
      }),
    ).toMatchObject({
      ok: true,
      quotes: [{ quote_id: 'q-1' }],
      meta: { page: 1 },
    });
    expect(request).toHaveBeenCalledWith({
      path: '/api/v1/pharmacy/rx-quotes?page=1&status=NOTIFIED',
      method: 'GET',
    });
    request.mockResolvedValueOnce(ok({ quote_id: 'q-1', status: 'QUOTED' }));
    expect(
      await submitRxQuotes({
        screen: 'rx-quotes',
        action: 'quote',
        values: { quoteId: 'q-1', price: 120, notes: 'Same day' },
      }),
    ).toMatchObject({ ok: true, quote: { status: 'QUOTED' } });
    request.mockResolvedValueOnce(
      ok({ quote_id: 'q-1', status: 'OUT_OF_STOCK' }),
    );
    expect(
      await submitRxQuotes({
        screen: 'rx-quotes',
        action: 'decline',
        values: { quoteId: 'q-1', reason: 'No stock' },
      }),
    ).toMatchObject({ ok: true, decline: { status: 'OUT_OF_STOCK' } });
  });

  it('maps quote failures', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(fail('PRICE_ABOVE_MRP'));
    expect(
      await submitRxQuotes({
        screen: 'rx-quotes',
        action: 'quote',
        values: { quoteId: 'q-1', price: 999 },
      }),
    ).toMatchObject({ ok: false, code: 'PRICE_ABOVE_MRP' });
    request.mockResolvedValueOnce(fail('UNAUTHORIZED'));
    expect(
      await submitRxQuotes({ screen: 'rx-quotes', action: 'load' }),
    ).toMatchObject({ ok: false, code: 'UNAUTHORIZED' });
    request.mockResolvedValueOnce(fail('VALIDATION_ERROR'));
    expect(
      await submitRxQuotes({
        screen: 'rx-quotes',
        action: 'decline',
        values: { quoteId: 'q-1' },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
  });

  it('accepts, rejects, advances status, and assigns a rider', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(
      ok({ order_id: ORDER_ID, status: 'ACCEPTED' }),
    );
    expect(
      await submitOrders({
        screen: 'order-actions',
        action: 'accept',
        values: { orderId: ORDER_ID },
      }),
    ).toMatchObject({ ok: true, accept: { status: 'ACCEPTED' } });
    request.mockResolvedValueOnce(
      ok({ order_id: ORDER_ID, status: 'REJECTED' }),
    );
    expect(
      await submitOrders({
        screen: 'order-actions',
        action: 'reject',
        values: { orderId: ORDER_ID, reason: 'No stock' },
      }),
    ).toMatchObject({ ok: true, reject: { status: 'REJECTED' } });
    request.mockResolvedValueOnce(ok({ order_id: ORDER_ID, status: 'PACKED' }));
    expect(
      await submitOrders({
        screen: 'order-actions',
        action: 'advanceStatus',
        values: { orderId: ORDER_ID, status: 'PACKED' },
      }),
    ).toMatchObject({ ok: true, status: { status: 'PACKED' } });
    expect(request.mock.calls.at(-1)?.[0]).toMatchObject({
      path: `/api/v1/pharmacy/orders/${ORDER_ID}/status`,
      method: 'PATCH',
      body: { status: 'PACKED' },
    });
    request.mockResolvedValueOnce(
      ok({ order_id: ORDER_ID, rider_id: RIDER_ID }),
    );
    expect(
      await submitOrders({
        screen: 'order-actions',
        action: 'assignRider',
        values: { orderId: ORDER_ID, rider_id: RIDER_ID },
      }),
    ).toMatchObject({ ok: true, assign: { rider_id: RIDER_ID } });
  });

  it('blocks invalid UUIDs before calling Core', async () => {
    const request = vi.spyOn(hostApi, 'request');
    expect(
      await submitOrders({
        screen: 'order-actions',
        action: 'accept',
        values: { orderId: 'nope' },
      }),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    expect(
      await submitOrders({
        screen: 'order-actions',
        action: 'assignRider',
        values: { orderId: ORDER_ID, rider_id: 'nope' },
      }),
    ).toMatchObject({
      ok: false,
      fieldErrors: { rider_id: expect.any(String) },
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('maps order failures', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(fail('ORDER_NOT_FOUND', 'Gone', 404));
    expect(
      await submitOrders({
        screen: 'order-actions',
        action: 'accept',
        values: { orderId: ORDER_ID },
      }),
    ).toMatchObject({ ok: false, code: 'ORDER_NOT_FOUND' });
    request.mockResolvedValueOnce(fail('ORDER_ALREADY_ACTIONED'));
    expect(
      await submitOrders({
        screen: 'order-actions',
        action: 'reject',
        values: { orderId: ORDER_ID },
      }),
    ).toMatchObject({ ok: false, code: 'ORDER_ALREADY_ACTIONED' });
    request.mockResolvedValueOnce(fail('INVALID_STATUS_TRANSITION'));
    expect(
      await submitOrders({
        screen: 'order-actions',
        action: 'advanceStatus',
        values: { orderId: ORDER_ID, status: 'DELIVERED' },
      }),
    ).toMatchObject({ ok: false, code: 'INVALID_STATUS_TRANSITION' });
    request.mockResolvedValueOnce(fail('POS_TOKEN_RESTRICTED'));
    expect(
      await submitOrders({
        screen: 'order-actions',
        action: 'assignRider',
        values: { orderId: ORDER_ID, rider_id: RIDER_ID },
      }),
    ).toMatchObject({ ok: false, code: 'POS_TOKEN_RESTRICTED' });
  });
});
