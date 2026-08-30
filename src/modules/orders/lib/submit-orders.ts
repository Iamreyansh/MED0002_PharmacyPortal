import type {
  OrderActionResult,
  OrdersCommand,
  OrdersSubmitResult,
} from '@medmate/orders-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { isUuid } from '@/modules/auth';
import { failureResult } from '@/modules/orders/lib/errors';
import { asObject } from '@/modules/orders/lib/query';

const ORDERS_PATH = '/api/v1/pharmacy/orders';

function invalidId(): OrdersSubmitResult {
  return {
    ok: false,
    code: 'VALIDATION_ERROR',
    formError: 'This order id is not a valid UUID.',
  };
}

export async function submitOrders(
  command: OrdersCommand,
): Promise<OrdersSubmitResult> {
  if (command.screen === 'orders-home') {
    return { ok: true };
  }
  if (command.screen !== 'order-actions') {
    return { ok: false, formError: 'This screen cannot action an order.' };
  }
  if (!command.values?.orderId || !isUuid(command.values.orderId)) {
    return invalidId();
  }
  if (command.action === 'accept') {
    const result = await hostApi.request<unknown>({
      path: `${ORDERS_PATH}/${command.values.orderId}/accept`,
      method: 'POST',
      body: {},
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, accept: asObject<OrderActionResult>(result.data) };
  }
  if (command.action === 'reject') {
    const result = await hostApi.request<unknown>({
      path: `${ORDERS_PATH}/${command.values.orderId}/reject`,
      method: 'POST',
      body: { reason: command.values.reason },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, reject: asObject<OrderActionResult>(result.data) };
  }
  if (command.action === 'advanceStatus') {
    const result = await hostApi.request<unknown>({
      path: `${ORDERS_PATH}/${command.values.orderId}/status`,
      method: 'PATCH',
      body: { status: command.values.status },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, status: asObject<OrderActionResult>(result.data) };
  }
  if (command.action === 'assignRider') {
    if (!isUuid(command.values.rider_id)) {
      return {
        ok: false,
        code: 'VALIDATION_ERROR',
        fieldErrors: { rider_id: 'Enter a valid rider UUID.' },
        formError: 'Enter a valid rider UUID.',
      };
    }
    const result = await hostApi.request<unknown>({
      path: `${ORDERS_PATH}/${command.values.orderId}/assign-rider`,
      method: 'POST',
      body: { rider_id: command.values.rider_id },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, assign: asObject<OrderActionResult>(result.data) };
  }
  return { ok: false, formError: 'This screen cannot action an order.' };
}
