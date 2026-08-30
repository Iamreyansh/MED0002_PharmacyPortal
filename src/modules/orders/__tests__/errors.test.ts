import { describe, expect, it } from 'vitest';
import {
  failureResult,
  fieldErrorsFromDetails,
  ordersErrorCopy,
} from '@/modules/orders/lib/errors';

describe('orders errors', () => {
  it('maps details and copy', () => {
    expect(fieldErrorsFromDetails({ reason: 'Required' })).toEqual({
      reason: 'Required',
    });
    expect(fieldErrorsFromDetails(null)).toBeUndefined();
    expect(fieldErrorsFromDetails([])).toBeUndefined();
    expect(fieldErrorsFromDetails({ reason: 1 })).toBeUndefined();
    expect(ordersErrorCopy('PRICE_ABOVE_MRP', undefined)).toMatch(/MRP/);
    expect(ordersErrorCopy('ORDER_NOT_FOUND', undefined)).toMatch(/not found/);
    expect(ordersErrorCopy('ORDER_ALREADY_ACTIONED', undefined)).toMatch(
      /already/,
    );
    expect(ordersErrorCopy('INVALID_STATUS_TRANSITION', undefined)).toMatch(
      /transition/,
    );
    expect(ordersErrorCopy('VALIDATION_ERROR', undefined)).toMatch(/fields/);
    expect(ordersErrorCopy('FORBIDDEN', undefined)).toMatch(/permission/);
    expect(ordersErrorCopy('INSUFFICIENT_PERMISSIONS', undefined)).toMatch(
      /permission/,
    );
    expect(ordersErrorCopy('POS_TOKEN_RESTRICTED', undefined)).toMatch(
      /session/,
    );
    expect(ordersErrorCopy('UNAUTHORIZED', undefined)).toMatch(/Sign in/);
    expect(ordersErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(ordersErrorCopy(undefined, undefined)).toBe(
      'Unable to continue. Try again.',
    );
    expect(ordersErrorCopy('X', ' From Core ')).toBe('From Core');
    expect(
      failureResult('VALIDATION_ERROR', undefined, { reason: 'Need' }),
    ).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { reason: 'Need' },
      formError: 'Check the highlighted fields and try again.',
    });
  });
});
