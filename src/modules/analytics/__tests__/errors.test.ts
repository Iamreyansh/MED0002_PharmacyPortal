import { describe, expect, it } from 'vitest';
import {
  analyticsErrorCopy,
  failureResult,
  fieldErrorsFromDetails,
} from '@/modules/analytics/lib/errors';

describe('analytics errors', () => {
  it('maps details and copy', () => {
    expect(fieldErrorsFromDetails({ reason: 'Required' })).toEqual({
      reason: 'Required',
    });
    expect(fieldErrorsFromDetails(null)).toBeUndefined();
    expect(fieldErrorsFromDetails([])).toBeUndefined();
    expect(fieldErrorsFromDetails({ reason: 1 })).toBeUndefined();
    expect(analyticsErrorCopy('REPORT_NOT_FOUND', undefined)).toMatch(
      /not found/,
    );
    expect(analyticsErrorCopy('PLAN_UPGRADE_REQUIRED', undefined)).toMatch(
      /Growth/,
    );
    expect(analyticsErrorCopy('PLAN_FEATURE_LOCKED', undefined)).toMatch(
      /Growth/,
    );
    expect(analyticsErrorCopy('VALIDATION_ERROR', undefined)).toMatch(/fields/);
    expect(analyticsErrorCopy('INVALID_PERIOD', undefined)).toMatch(/fields/);
    expect(analyticsErrorCopy('FORBIDDEN', undefined)).toMatch(/permission/);
    expect(analyticsErrorCopy('INSUFFICIENT_PERMISSIONS', undefined)).toMatch(
      /permission/,
    );
    expect(analyticsErrorCopy('POS_TOKEN_RESTRICTED', undefined)).toMatch(
      /session/,
    );
    expect(analyticsErrorCopy('UNAUTHORIZED', undefined)).toMatch(/Sign in/);
    expect(analyticsErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(analyticsErrorCopy(undefined, undefined)).toBe(
      'Unable to continue. Try again.',
    );
    expect(analyticsErrorCopy('X', ' From Core ')).toBe('From Core');
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
