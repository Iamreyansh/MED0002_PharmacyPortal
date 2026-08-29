import { describe, expect, it } from 'vitest';
import {
  failureResult,
  fieldErrorsFromDetails,
  subscriptionErrorCopy,
} from '@/modules/subscription/lib/errors';

describe('subscription errors', () => {
  it('maps details and copy without treating permissions as upgrades', () => {
    expect(fieldErrorsFromDetails({ plan_id: 'Required' })).toEqual({
      plan_id: 'Required',
    });
    expect(fieldErrorsFromDetails(null)).toBeUndefined();
    expect(fieldErrorsFromDetails([])).toBeUndefined();
    expect(fieldErrorsFromDetails({ plan_id: 1 })).toBeUndefined();
    expect(subscriptionErrorCopy('VALIDATION_ERROR', undefined)).toBe(
      'Check the highlighted fields and try again.',
    );
    expect(subscriptionErrorCopy('FORBIDDEN', undefined)).toBe(
      'You do not have permission to do that.',
    );
    expect(subscriptionErrorCopy('INSUFFICIENT_PERMISSIONS', undefined)).toBe(
      'You do not have permission to do that.',
    );
    expect(
      subscriptionErrorCopy('INSUFFICIENT_PERMISSIONS', undefined),
    ).not.toMatch(/upgrade/i);
    expect(subscriptionErrorCopy('INVOICE_NOT_FOUND', undefined)).toBe(
      'This invoice is no longer available.',
    );
    expect(subscriptionErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(subscriptionErrorCopy(undefined, undefined)).toBe(
      'Unable to continue. Try again.',
    );
    expect(subscriptionErrorCopy('X', ' From Core ')).toBe('From Core');
    expect(failureResult('FORBIDDEN', undefined, null)).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    });
  });
});
