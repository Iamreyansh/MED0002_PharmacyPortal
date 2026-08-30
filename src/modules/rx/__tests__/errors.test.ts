import { describe, expect, it } from 'vitest';
import {
  failureResult,
  fieldErrorsFromDetails,
  rxErrorCopy,
} from '@/modules/rx/lib/errors';

describe('rx errors', () => {
  it('maps details and copy', () => {
    expect(fieldErrorsFromDetails({ reason: 'Required' })).toEqual({
      reason: 'Required',
    });
    expect(fieldErrorsFromDetails(null)).toBeUndefined();
    expect(fieldErrorsFromDetails([])).toBeUndefined();
    expect(fieldErrorsFromDetails({ reason: 1 })).toBeUndefined();
    expect(rxErrorCopy('RX_NOT_FOUND', undefined)).toMatch(/prescription/);
    expect(rxErrorCopy('INSUFFICIENT_STOCK', undefined)).toMatch(/Stock/);
    expect(rxErrorCopy('ILLEGAL_STATE', undefined)).toMatch(/status/);
    expect(rxErrorCopy('PLAN_FEATURE_LOCKED', undefined)).toMatch(/Starter/);
    expect(rxErrorCopy('MODULE_NOT_IN_PLAN', undefined)).toMatch(/Starter/);
    expect(rxErrorCopy('VALIDATION_ERROR', undefined)).toMatch(/fields/);
    expect(rxErrorCopy('FORBIDDEN', undefined)).toMatch(/permission/);
    expect(rxErrorCopy('INSUFFICIENT_PERMISSIONS', undefined)).toMatch(
      /permission/,
    );
    expect(rxErrorCopy('POS_TOKEN_RESTRICTED', undefined)).toMatch(/session/);
    expect(rxErrorCopy('UNAUTHORIZED', undefined)).toMatch(/Sign in/);
    expect(rxErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(rxErrorCopy(undefined, undefined)).toBe(
      'Unable to continue. Try again.',
    );
    expect(rxErrorCopy('X', ' From Core ')).toBe('From Core');
    expect(
      failureResult('VALIDATION_ERROR', undefined, { reason: 'Need' }),
    ).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { reason: 'Need' },
      formError: 'Check the highlighted fields and try again.',
    });
    expect(failureResult('INSUFFICIENT_STOCK', undefined, null)).toMatchObject({
      ok: false,
      code: 'INSUFFICIENT_STOCK',
    });
  });
});
