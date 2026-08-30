import { describe, expect, it } from 'vitest';
import {
  failureResult,
  fieldErrorsFromDetails,
  financeErrorCopy,
} from '@/modules/finance/lib/errors';

describe('finance errors', () => {
  it('maps details and copy', () => {
    expect(fieldErrorsFromDetails({ reason: 'Required' })).toEqual({
      reason: 'Required',
    });
    expect(fieldErrorsFromDetails(null)).toBeUndefined();
    expect(fieldErrorsFromDetails([])).toBeUndefined();
    expect(fieldErrorsFromDetails({ reason: 1 })).toBeUndefined();
    expect(financeErrorCopy('SETTLEMENT_NOT_FOUND', undefined)).toMatch(
      /not found/,
    );
    expect(financeErrorCopy('VALIDATION_ERROR', undefined)).toMatch(/fields/);
    expect(financeErrorCopy('FORBIDDEN', undefined)).toMatch(/permission/);
    expect(financeErrorCopy('INSUFFICIENT_PERMISSIONS', undefined)).toMatch(
      /permission/,
    );
    expect(financeErrorCopy('POS_TOKEN_RESTRICTED', undefined)).toMatch(
      /session/,
    );
    expect(financeErrorCopy('UNAUTHORIZED', undefined)).toMatch(/Sign in/);
    expect(financeErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(financeErrorCopy(undefined, undefined)).toBe(
      'Unable to continue. Try again.',
    );
    expect(financeErrorCopy('X', ' From Core ')).toBe('From Core');
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
