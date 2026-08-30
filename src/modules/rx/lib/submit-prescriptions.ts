import type {
  RxApproveResult,
  RxCommand,
  RxDetail,
  RxDispenseResult,
  RxQueueRow,
  RxRejectResult,
  RxSubmitResult,
} from '@medmate/rx-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/rx/lib/errors';
import {
  asCollection,
  asMeta,
  asObject,
  withQuery,
} from '@/modules/rx/lib/query';

const LIST_PATH = '/api/v1/pharmacy/prescriptions';

function cartIdFrom(data: unknown): string | null {
  const row = asObject<Record<string, unknown>>(data);
  if (typeof row?.cart_id === 'string' && row.cart_id.length > 0) {
    return row.cart_id;
  }
  return null;
}

export async function submitPrescriptions(
  command: RxCommand,
): Promise<RxSubmitResult> {
  if (command.screen !== 'queue' && command.screen !== 'detail') {
    return { ok: false, formError: 'This screen cannot load prescriptions.' };
  }
  if (command.action === 'load' && command.screen === 'queue') {
    const result = await hostApi.request<unknown>({
      path: withQuery(LIST_PATH, {
        page: command.values?.page,
        limit: command.values?.limit,
        status: command.values?.status,
      }),
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return {
      ok: true,
      prescriptions: asCollection<RxQueueRow>(result.data, [
        'prescriptions',
        'items',
      ]),
      meta: asMeta(result.details),
    };
  }
  if (command.action === 'load' && command.screen === 'detail') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${command.values.rxId}`,
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, prescription: asObject<RxDetail>(result.data) };
  }
  if (command.action === 'approve' && command.screen === 'detail') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${command.values.rxId}/approve`,
      method: 'POST',
      body: {},
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, approve: asObject<RxApproveResult>(result.data) };
  }
  if (command.action === 'reject' && command.screen === 'detail') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${command.values.rxId}/reject`,
      method: 'POST',
      body: { reason: command.values.reason },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, reject: asObject<RxRejectResult>(result.data) };
  }
  if (command.action === 'dispense' && command.screen === 'detail') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${command.values.rxId}/dispense`,
      method: 'POST',
      body: {},
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, dispense: asObject<RxDispenseResult>(result.data) };
  }
  if (command.action === 'dispenseToBilling' && command.screen === 'detail') {
    const result = await hostApi.request<unknown>({
      path: `${LIST_PATH}/${command.values.rxId}/dispense-to-billing`,
      method: 'POST',
      body: {},
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    const dispense = asObject<RxDispenseResult>(result.data);
    return {
      ok: true,
      dispense,
      cart_id: cartIdFrom(result.data) ?? dispense?.cart_id ?? null,
    };
  }
  return { ok: false, formError: 'This screen cannot load prescriptions.' };
}
