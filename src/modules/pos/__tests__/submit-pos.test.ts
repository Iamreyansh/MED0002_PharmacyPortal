import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostApiResponse } from '@medmate/contracts';
import { hostApi } from '@/modules/api';
import { submitPos } from '@/modules/pos/lib/submit-pos';

afterEach(() => {
  vi.restoreAllMocks();
});

function ok<T>(data: T, status = 200): HostApiResponse<T> {
  return { ok: true, status, data };
}

function fail(
  code: string,
  message = code,
  status = 400,
): HostApiResponse<never> {
  return { ok: false, status, data: undefined as never, code, message };
}

const ctx = { cartId: 'cart-1', checkoutKey: 'key-1' };

describe('submitPos', () => {
  it('rejects a mismatched screen', async () => {
    expect(
      await submitPos(
        { screen: 'nope' as 'counter', action: 'createCart' },
        ctx,
      ),
    ).toMatchObject({ ok: false });
  });

  it('creates, loads, and recreates a stale cart', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(
      ok({ cart_id: 'cart-2', items: [], grand_total: 0 }),
    );
    const created = await submitPos(
      { screen: 'counter', action: 'createCart' },
      { cartId: null, checkoutKey: 'k' },
    );
    expect(created).toMatchObject({ ok: true, cart: { cart_id: 'cart-2' } });

    request.mockResolvedValueOnce(
      ok({ cart_id: 'cart-1', items: [{ item_id: 'i1' }] }),
    );
    const loaded = await submitPos(
      { screen: 'counter', action: 'loadCart' },
      ctx,
    );
    expect(loaded).toMatchObject({ ok: true, cart: { cart_id: 'cart-1' } });

    request
      .mockResolvedValueOnce(fail('CART_NOT_FOUND', 'gone', 404))
      .mockResolvedValueOnce(ok({ cart_id: 'cart-3', items: [] }));
    const stale = await submitPos(
      { screen: 'counter', action: 'loadCart', values: { cart_id: 'old' } },
      ctx,
    );
    expect(stale).toMatchObject({ ok: true, cart: { cart_id: 'cart-3' } });

    request.mockResolvedValueOnce(ok({ cart_id: 'opened', items: [] }));
    const opened = await submitPos(
      { screen: 'counter', action: 'loadCart' },
      { cartId: null, checkoutKey: 'k' },
    );
    expect(opened.ok).toBe(true);
  });

  it('adds, patches, deletes, searches, and discounts', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(
      ok({ item_id: 'i1', line_total: 24, cart_grand_total: 24 }),
    );
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'addItem',
          values: { product_id: 'p1', quantity: 1 },
        },
        ctx,
      ),
    ).toMatchObject({ ok: true, item: { item_id: 'i1' } });

    request.mockResolvedValueOnce(ok({ item_id: 'i1', quantity: 2 }));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'patchItem',
          values: { item_id: 'i1', quantity: 2 },
        },
        ctx,
      ),
    ).toMatchObject({ ok: true });

    request.mockResolvedValueOnce(ok({ item_id: 'i1' }));
    expect(
      await submitPos(
        { screen: 'counter', action: 'deleteItem', values: { item_id: 'i1' } },
        ctx,
      ),
    ).toMatchObject({ ok: true, deleted: true });

    request.mockResolvedValueOnce(
      ok({ results: [{ product_id: 'p1', name: 'Crocin' }], mode: 'TEXT' }),
    );
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'search',
          values: { query: 'crocin', mode: 'TEXT' },
        },
        ctx,
      ),
    ).toMatchObject({ ok: true, search: { results: [{ product_id: 'p1' }] } });

    request.mockResolvedValueOnce(
      ok({ discount_type: 'FLAT_RS', grand_total: 20 }),
    );
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'applyDiscount',
          values: { type: 'FLAT_RS', value: 4 },
        },
        ctx,
      ),
    ).toMatchObject({ ok: true, discount: { grand_total: 20 } });

    request.mockResolvedValueOnce(
      ok({ customer_id: 'c1', name: 'Anita', phone: '9' }),
    );
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'attachCustomer',
          values: { customer_phone: '9', customer_name: 'Anita' },
        },
        ctx,
      ),
    ).toMatchObject({ ok: true, customer: { customer_id: 'c1' } });
  });

  it('clears then creates a new cart and checks out with the same key', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request
      .mockResolvedValueOnce(ok({ items_removed: 1 }))
      .mockResolvedValueOnce(ok({ cart_id: 'cart-9', items: [] }));
    const cleared = await submitPos(
      { screen: 'counter', action: 'clearCart' },
      ctx,
    );
    expect(cleared).toMatchObject({
      ok: true,
      cleared: true,
      cart: { cart_id: 'cart-9' },
    });

    request.mockResolvedValueOnce(ok({ invoice_id: 'inv-1', grand_total: 48 }));
    const paid = await submitPos(
      {
        screen: 'counter',
        action: 'checkout',
        values: { payment_method: 'CASH', amount_paid: 50 },
      },
      ctx,
    );
    expect(paid).toMatchObject({ ok: true, receipt: { invoice_id: 'inv-1' } });
    expect(request.mock.calls.at(-1)?.[0]).toMatchObject({
      idempotencyKey: 'key-1',
      path: '/api/v1/pharmacy/pos/cart/cart-1/checkout',
    });
  });

  it('surfaces stock errors and recreates after CART_EXPIRED', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(fail('INSUFFICIENT_STOCK', 'short'));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'addItem',
          values: { product_id: 'p1', quantity: 9 },
        },
        ctx,
      ),
    ).toMatchObject({ ok: false, code: 'INSUFFICIENT_STOCK' });

    request
      .mockResolvedValueOnce(fail('CART_EXPIRED', 'expired', 410))
      .mockResolvedValueOnce(ok({ cart_id: 'fresh', items: [] }));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'search',
          values: { query: 'x', mode: 'TEXT' },
        },
        ctx,
      ),
    ).toMatchObject({ ok: true, cart: { cart_id: 'fresh' } });
  });

  it('opens a cart when none is held and rejects unknown actions', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request
      .mockResolvedValueOnce(ok({ cart_id: 'n1', items: [] }))
      .mockResolvedValueOnce(ok({ results: [] }));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'search',
          values: { query: 'x', mode: 'BARCODE' },
        },
        { cartId: null, checkoutKey: 'k' },
      ),
    ).toMatchObject({ ok: true });

    request.mockResolvedValueOnce(fail('VALIDATION_ERROR'));
    expect(
      await submitPos(
        { screen: 'counter', action: 'deleteItem', values: { item_id: 'i' } },
        ctx,
      ),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });

    expect(
      await submitPos({ screen: 'counter', action: 'nope' } as never, ctx),
    ).toMatchObject({ ok: false });
  });

  it('surfaces create and mutate failures that are not stale carts', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request.mockResolvedValueOnce(fail('MODULE_NOT_IN_PLAN', 'locked', 403));
    expect(
      await submitPos(
        { screen: 'counter', action: 'createCart' },
        { cartId: null, checkoutKey: 'k' },
      ),
    ).toMatchObject({ ok: false, code: 'MODULE_NOT_IN_PLAN' });

    request.mockResolvedValueOnce(ok({ status: 'OPEN' }));
    const created = await submitPos(
      { screen: 'counter', action: 'createCart' },
      { cartId: null, checkoutKey: 'k' },
    );
    expect(created).toMatchObject({ ok: true, cart: null });

    request.mockResolvedValueOnce(fail('FORBIDDEN', 'no', 403));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'search',
          values: { query: 'x', mode: 'TEXT' },
        },
        { cartId: null, checkoutKey: 'k' },
      ),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });

    request.mockResolvedValueOnce(ok({ not_a_cart: true }));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'addItem',
          values: { product_id: 'p1', quantity: 1 },
        },
        { cartId: null, checkoutKey: 'k' },
      ),
    ).toMatchObject({ ok: false, formError: 'Unable to open a cart.' });

    request.mockResolvedValueOnce(fail('PRODUCT_NOT_FOUND', 'missing', 404));
    expect(
      await submitPos(
        { screen: 'counter', action: 'loadCart', values: { cart_id: 'gone' } },
        ctx,
      ),
    ).toMatchObject({ ok: false, code: 'PRODUCT_NOT_FOUND' });

    request.mockResolvedValueOnce(fail('EMPTY_CART'));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'applyDiscount',
          values: { type: 'PERCENTAGE', value: 10 },
        },
        ctx,
      ),
    ).toMatchObject({ ok: false, code: 'EMPTY_CART' });

    request.mockResolvedValueOnce(fail('VALIDATION_ERROR', 'phone'));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'attachCustomer',
          values: { customer_phone: '' },
        },
        ctx,
      ),
    ).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });

    request.mockResolvedValueOnce(fail('FORBIDDEN', 'no', 403));
    expect(
      await submitPos({ screen: 'counter', action: 'clearCart' }, ctx),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });

    request
      .mockResolvedValueOnce(ok({ items_removed: 1 }))
      .mockResolvedValueOnce(fail('UNAUTHORIZED', 'auth', 401));
    expect(
      await submitPos({ screen: 'counter', action: 'clearCart' }, ctx),
    ).toMatchObject({ ok: false, code: 'UNAUTHORIZED' });

    request.mockResolvedValueOnce(fail('CREDIT_REQUIRES_NAMED_CUSTOMER'));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'checkout',
          values: { payment_method: 'CREDIT' },
        },
        ctx,
      ),
    ).toMatchObject({ ok: false, code: 'CREDIT_REQUIRES_NAMED_CUSTOMER' });

    request.mockResolvedValueOnce(fail('FORBIDDEN', 'no', 403));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'search',
          values: { query: 'x', mode: 'TEXT' },
        },
        ctx,
      ),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });

    request.mockResolvedValueOnce(fail('FORBIDDEN', 'no', 403));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'patchItem',
          values: { item_id: 'i1', quantity: 2 },
        },
        ctx,
      ),
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' });

    request.mockResolvedValueOnce(ok('not-search'));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'search',
          values: { query: 'x', mode: 'TEXT' },
        },
        ctx,
      ),
    ).toMatchObject({ ok: true, search: null });
  });

  it('recreates the cart after stale mutate and checkout codes', async () => {
    const request = vi.spyOn(hostApi, 'request');
    request
      .mockResolvedValueOnce(fail('CART_EXPIRED', 'expired', 410))
      .mockResolvedValueOnce(ok({ cart_id: 'fresh-add', items: [] }));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'addItem',
          values: { product_id: 'p1', quantity: 1, is_loose: true },
        },
        ctx,
      ),
    ).toMatchObject({ ok: true, cart: { cart_id: 'fresh-add' } });

    request
      .mockResolvedValueOnce(fail('CART_NOT_FOUND', 'gone', 404))
      .mockResolvedValueOnce(ok({ cart_id: 'fresh-patch', items: [] }));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'patchItem',
          values: { item_id: 'i1', quantity: 2, batch_id: 'b1' },
        },
        ctx,
      ),
    ).toMatchObject({ ok: true, cart: { cart_id: 'fresh-patch' } });

    request
      .mockResolvedValueOnce(fail('CART_EXPIRED', 'expired', 410))
      .mockResolvedValueOnce(ok({ cart_id: 'fresh-del', items: [] }));
    expect(
      await submitPos(
        { screen: 'counter', action: 'deleteItem', values: { item_id: 'i1' } },
        ctx,
      ),
    ).toMatchObject({ ok: true, cart: { cart_id: 'fresh-del' } });

    request
      .mockResolvedValueOnce(fail('CART_NOT_FOUND', 'gone', 404))
      .mockResolvedValueOnce(ok({ cart_id: 'fresh-cust', items: [] }));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'attachCustomer',
          values: { customer_phone: '9' },
        },
        ctx,
      ),
    ).toMatchObject({ ok: true, cart: { cart_id: 'fresh-cust' } });

    request
      .mockResolvedValueOnce(fail('CART_EXPIRED', 'expired', 400))
      .mockResolvedValueOnce(ok({ cart_id: 'fresh-disc', items: [] }));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'applyDiscount',
          values: { type: 'FLAT_RS', value: 1 },
        },
        ctx,
      ),
    ).toMatchObject({ ok: true, cart: { cart_id: 'fresh-disc' } });

    request
      .mockResolvedValueOnce(fail('CART_EXPIRED', 'expired', 400))
      .mockResolvedValueOnce(ok({ cart_id: 'fresh-pay', items: [] }));
    expect(
      await submitPos(
        {
          screen: 'counter',
          action: 'checkout',
          values: { payment_method: 'UPI', upi_reference: 'upi-1' },
        },
        ctx,
      ),
    ).toMatchObject({ ok: true, cart: { cart_id: 'fresh-pay' } });

    request
      .mockResolvedValueOnce(fail('CART_NOT_FOUND', 'gone', 404))
      .mockResolvedValueOnce(ok({ cart_id: 'after-stale-clear', items: [] }));
    expect(
      await submitPos(
        { screen: 'counter', action: 'clearCart' },
        { cartId: 'missing', checkoutKey: 'k' },
      ),
    ).toMatchObject({
      ok: true,
      cart: { cart_id: 'after-stale-clear' },
    });
  });
});
