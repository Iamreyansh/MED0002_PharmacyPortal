import { describe, expect, it } from 'vitest';
import {
  billingErrorCopy,
  failureResult,
  fieldErrorsFromDetails,
} from '@/modules/billing/lib/errors';

describe('billing errors', () => {
  it('maps details and copy without leaking phone numbers', () => {
    expect(fieldErrorsFromDetails({ invoice_prefix: 'Required' })).toEqual({
      invoice_prefix: 'Required',
    });
    expect(fieldErrorsFromDetails(null)).toBeUndefined();
    expect(fieldErrorsFromDetails([])).toBeUndefined();
    expect(fieldErrorsFromDetails({ invoice_prefix: 1 })).toBeUndefined();
    expect(billingErrorCopy('INVOICE_NOT_FOUND', undefined)).toMatch(/invoice/);
    expect(billingErrorCopy('SALE_NOT_FOUND', undefined)).toMatch(/sale/);
    expect(billingErrorCopy('STAFF_CANNOT_MARK_PAID', undefined)).toMatch(
      /owner/,
    );
    expect(billingErrorCopy('SALE_ALREADY_PAID', undefined)).toMatch(/paid/);
    expect(billingErrorCopy('AMOUNT_MISMATCH', undefined)).toMatch(/amount/);
    expect(billingErrorCopy('POS_TOKEN_RESTRICTED', undefined)).toMatch(
      /session/,
    );
    expect(billingErrorCopy('INVALID_PREFIX_FORMAT', undefined)).toMatch(
      /prefix/,
    );
    expect(billingErrorCopy('INVALID_ACCENT_COLOR', undefined)).toMatch(/hex/);
    expect(billingErrorCopy('INVALID_IFSC_CODE', undefined)).toMatch(/IFSC/);
    expect(billingErrorCopy('INVALID_RECIPIENT', undefined)).toMatch(
      /phone or email/,
    );
    expect(billingErrorCopy('CHANNEL_UNAVAILABLE', undefined)).toMatch(
      /channel/,
    );
    expect(billingErrorCopy('EXPORT_RANGE_TOO_LARGE', undefined)).toMatch(
      /12 months/,
    );
    expect(billingErrorCopy('PLAN_FEATURE_LOCKED', undefined)).toMatch(/plan/);
    expect(billingErrorCopy('MODULE_NOT_IN_PLAN', undefined)).toMatch(/plan/);
    expect(billingErrorCopy('VALIDATION_ERROR', undefined)).toMatch(/fields/);
    expect(billingErrorCopy('FORBIDDEN', undefined)).toMatch(/permission/);
    expect(billingErrorCopy('INSUFFICIENT_PERMISSIONS', undefined)).toMatch(
      /permission/,
    );
    expect(billingErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(billingErrorCopy(undefined, undefined)).toBe(
      'Unable to continue. Try again.',
    );
    expect(billingErrorCopy('X', ' From Core ')).toBe('From Core');
    expect(
      failureResult('INVALID_PREFIX_FORMAT', undefined, null).fieldErrors,
    ).toMatchObject({ invoice_prefix: expect.stringMatching(/prefix/) });
    expect(
      failureResult('INVALID_ACCENT_COLOR', undefined, null).fieldErrors,
    ).toMatchObject({ accent_color: expect.stringMatching(/hex/) });
    expect(
      failureResult('INVALID_IFSC_CODE', undefined, { ifsc_code: 'Bad' })
        .fieldErrors,
    ).toMatchObject({ ifsc_code: expect.stringMatching(/IFSC|Bad/) });
    expect(failureResult('FORBIDDEN', undefined, null)).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    });
  });
});
