import type {
  DeclineResult,
  OrdersCommand,
  OrdersSubmitResult,
  QuoteResult,
  RxQuoteRow,
} from '@medmate/orders-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/orders/lib/errors';
import {
  asCollection,
  asMeta,
  asObject,
  withQuery,
} from '@/modules/orders/lib/query';

const QUOTES_PATH = '/api/v1/pharmacy/rx-quotes';

export async function submitRxQuotes(
  command: OrdersCommand,
): Promise<OrdersSubmitResult> {
  if (command.screen !== 'rx-quotes') {
    return { ok: false, formError: 'This screen cannot load quotes.' };
  }
  if (command.action === 'load') {
    const result = await hostApi.request<unknown>({
      path: withQuery(QUOTES_PATH, {
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
      quotes: asCollection<RxQuoteRow>(result.data, ['quotes', 'items']),
      meta: asMeta(result.details),
    };
  }
  if (command.action === 'quote') {
    const result = await hostApi.request<unknown>({
      path: `${QUOTES_PATH}/${command.values.quoteId}/quote`,
      method: 'POST',
      body: {
        price: command.values.price,
        notes: command.values.notes,
      },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, quote: asObject<QuoteResult>(result.data) };
  }
  if (command.action === 'decline') {
    const result = await hostApi.request<unknown>({
      path: `${QUOTES_PATH}/${command.values.quoteId}/decline`,
      method: 'POST',
      body: { reason: command.values.reason },
      idempotencyKey: createIdempotencyKey(),
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, decline: asObject<DeclineResult>(result.data) };
  }
  return { ok: false, formError: 'This screen cannot load quotes.' };
}
