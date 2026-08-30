import type {
  PosAttachedCustomer,
  PosCart,
  PosCartLine,
  PosCommand,
  PosDiscountResult,
  PosReceipt,
  PosSearchHit,
  PosSearchResult,
  PosSubmitFailure,
  PosSubmitResult,
} from '@medmate/pos-contract';
import { isCartStale } from '@medmate/pos-contract';
import { PORTAL_ERROR } from '@/config/api-client';
import { hostApi } from '@/modules/api';
import { failureResult } from '@/modules/pos/lib/errors';
import { POS_CART_PATH, cartItemPath, cartPath } from '@/modules/pos/lib/paths';
import { asCollection, asObject } from '@/modules/pos/lib/query';

export type PosSubmitContext = {
  cartId: string | null;
  checkoutKey: string;
};

function asCart(data: unknown): PosCart | null {
  const row = asObject<PosCart>(data);
  if (!row || typeof row.cart_id !== 'string') {
    return null;
  }
  return {
    ...row,
    items: asCollection<NonNullable<PosCart['items']>[number]>(row.items, [
      'items',
    ]),
  };
}

function asSearch(data: unknown): PosSearchResult | null {
  const row = asObject<PosSearchResult>(data);
  if (!row) {
    return null;
  }
  return {
    ...row,
    results: asCollection<PosSearchHit>(row.results, ['results']),
  };
}

async function createCart(): Promise<PosSubmitResult> {
  const result = await hostApi.request<unknown>({
    path: POS_CART_PATH,
    method: 'POST',
    body: {},
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  return { ok: true, cart: asCart(result.data) };
}

async function requireCart(
  cartId: string | null,
): Promise<{ ok: true; cartId: string } | PosSubmitFailure> {
  if (cartId) {
    return { ok: true, cartId };
  }
  const created = await createCart();
  if (!created.ok) {
    return created;
  }
  const next = created.cart?.cart_id;
  if (!next) {
    return { ok: false, formError: 'Unable to open a cart.' };
  }
  return { ok: true, cartId: next };
}

async function recoverIfStale(
  code: string | undefined,
): Promise<PosSubmitResult | null> {
  if (!isCartStale(code)) {
    return null;
  }
  return createCart();
}

export async function submitPos(
  command: PosCommand,
  ctx: PosSubmitContext,
): Promise<PosSubmitResult> {
  if (command.screen !== 'counter') {
    return { ok: false, formError: 'This screen cannot run the counter.' };
  }

  if (command.action === 'createCart') {
    return createCart();
  }

  if (command.action === 'loadCart') {
    const cartId = command.values?.cart_id ?? ctx.cartId;
    if (!cartId) {
      return createCart();
    }
    const result = await hostApi.request<unknown>({
      path: cartPath(cartId),
      method: 'GET',
    });
    if (!result.ok) {
      return (
        (await recoverIfStale(result.code)) ??
        failureResult(result.code, result.message, result.details)
      );
    }
    return { ok: true, cart: asCart(result.data) };
  }

  const opened = await requireCart(ctx.cartId);
  if (!opened.ok) {
    return opened;
  }
  const cartId = opened.cartId;

  if (command.action === 'search') {
    const result = await hostApi.request<unknown>({
      path: `${cartPath(cartId)}/search`,
      method: 'POST',
      body: { query: command.values.query, mode: command.values.mode },
    });
    if (!result.ok) {
      return (
        (await recoverIfStale(result.code)) ??
        failureResult(result.code, result.message, result.details)
      );
    }
    return { ok: true, search: asSearch(result.data) };
  }

  if (command.action === 'addItem') {
    const result = await hostApi.request<unknown>({
      path: `${cartPath(cartId)}/items`,
      method: 'POST',
      body: {
        product_id: command.values.product_id,
        quantity: command.values.quantity,
        batch_id: command.values.batch_id,
        is_loose: command.values.is_loose,
      },
    });
    if (!result.ok) {
      return (
        (await recoverIfStale(result.code)) ??
        failureResult(result.code, result.message, result.details)
      );
    }
    return { ok: true, item: asObject<PosCartLine>(result.data) };
  }

  if (command.action === 'patchItem') {
    const result = await hostApi.request<unknown>({
      path: cartItemPath(cartId, command.values.item_id),
      method: 'PATCH',
      body: {
        quantity: command.values.quantity,
        batch_id: command.values.batch_id,
        is_loose: command.values.is_loose,
      },
    });
    if (!result.ok) {
      return (
        (await recoverIfStale(result.code)) ??
        failureResult(result.code, result.message, result.details)
      );
    }
    return { ok: true, item: asObject<PosCartLine>(result.data) };
  }

  if (command.action === 'deleteItem') {
    const result = await hostApi.request<unknown>({
      path: cartItemPath(cartId, command.values.item_id),
      method: 'DELETE',
    });
    if (!result.ok) {
      return (
        (await recoverIfStale(result.code)) ??
        failureResult(result.code, result.message, result.details)
      );
    }
    return { ok: true, deleted: true };
  }

  if (command.action === 'clearCart') {
    const cleared = await hostApi.request<unknown>({
      path: cartPath(cartId),
      method: 'DELETE',
    });
    if (!cleared.ok && !isCartStale(cleared.code)) {
      return failureResult(cleared.code, cleared.message, cleared.details);
    }
    const created = await createCart();
    if (!created.ok) {
      return created;
    }
    return { ok: true, cleared: true, cart: created.cart };
  }

  if (command.action === 'attachCustomer') {
    const result = await hostApi.request<unknown>({
      path: `${cartPath(cartId)}/customer`,
      method: 'POST',
      body: {
        customer_phone: command.values.customer_phone,
        customer_name: command.values.customer_name,
      },
    });
    if (!result.ok) {
      return (
        (await recoverIfStale(result.code)) ??
        failureResult(result.code, result.message, result.details)
      );
    }
    return { ok: true, customer: asObject<PosAttachedCustomer>(result.data) };
  }

  if (command.action === 'applyDiscount') {
    const result = await hostApi.request<unknown>({
      path: `${cartPath(cartId)}/discount`,
      method: 'POST',
      body: { type: command.values.type, value: command.values.value },
    });
    if (!result.ok) {
      return (
        (await recoverIfStale(result.code)) ??
        failureResult(result.code, result.message, result.details)
      );
    }
    return { ok: true, discount: asObject<PosDiscountResult>(result.data) };
  }

  if (command.action !== 'checkout') {
    return { ok: false, formError: 'This screen cannot run the counter.' };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return failureResult(
      PORTAL_ERROR.NETWORK_ERROR,
      'Checkout is blocked while offline.',
      undefined,
    );
  }

  const result = await hostApi.request<unknown>({
    path: `${cartPath(cartId)}/checkout`,
    method: 'POST',
    idempotencyKey: ctx.checkoutKey,
    body: {
      payment_method: command.values.payment_method,
      amount_paid: command.values.amount_paid,
      upi_reference: command.values.upi_reference,
      prescribing_doctor: command.values.prescribing_doctor,
    },
  });
  if (!result.ok) {
    return (
      (await recoverIfStale(result.code)) ??
      failureResult(result.code, result.message, result.details)
    );
  }
  return { ok: true, receipt: asObject<PosReceipt>(result.data) };
}
