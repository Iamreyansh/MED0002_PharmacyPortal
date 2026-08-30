import { describe, expect, it } from 'vitest';
import {
  failureResult,
  fieldErrorsFromDetails,
  supportErrorCopy,
} from '@/modules/support/lib/errors';

describe('support errors', () => {
  it('maps details and copy', () => {
    expect(fieldErrorsFromDetails({ subject: 'Required' })).toEqual({
      subject: 'Required',
    });
    expect(fieldErrorsFromDetails(null)).toBeUndefined();
    expect(fieldErrorsFromDetails([])).toBeUndefined();
    expect(fieldErrorsFromDetails({ subject: 1 })).toBeUndefined();
    expect(supportErrorCopy('TICKET_NOT_FOUND', undefined)).toMatch(
      /not found/,
    );
    expect(supportErrorCopy('HELP_ARTICLE_NOT_FOUND', undefined)).toMatch(
      /not found/,
    );
    expect(supportErrorCopy('VALIDATION_ERROR', undefined)).toMatch(/fields/);
    expect(supportErrorCopy('FORBIDDEN', undefined)).toMatch(/permission/);
    expect(supportErrorCopy('INSUFFICIENT_PERMISSIONS', undefined)).toMatch(
      /permission/,
    );
    expect(supportErrorCopy('POS_TOKEN_RESTRICTED', undefined)).toMatch(
      /session/,
    );
    expect(supportErrorCopy('UNAUTHORIZED', undefined)).toMatch(/Sign in/);
    expect(supportErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(supportErrorCopy(undefined, undefined)).toBe(
      'Unable to continue. Try again.',
    );
    expect(supportErrorCopy('X', ' From Core ')).toBe('From Core');
    expect(
      failureResult('VALIDATION_ERROR', undefined, { subject: 'Need' }),
    ).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { subject: 'Need' },
      formError: 'Check the highlighted fields and try again.',
    });
    expect(supportErrorCopy('FORBIDDEN', undefined)).not.toMatch(/upgrade/i);
  });
});
