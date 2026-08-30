import { describe, expect, it } from 'vitest';
import {
  failureResult,
  fieldErrorsFromDetails,
  procurementErrorCopy,
} from '@/modules/procurement/lib/errors';

describe('procurement errors', () => {
  it('maps details and copy without leaking GSTIN or phone', () => {
    expect(fieldErrorsFromDetails({ invoice_number: 'Required' })).toEqual({
      invoice_number: 'Required',
    });
    expect(fieldErrorsFromDetails(null)).toBeUndefined();
    expect(fieldErrorsFromDetails([])).toBeUndefined();
    expect(fieldErrorsFromDetails({ invoice_number: 1 })).toBeUndefined();
    expect(procurementErrorCopy('GRN_NOT_FOUND', undefined)).toBe(
      'This receipt is no longer available.',
    );
    expect(procurementErrorCopy('STAFF_CANNOT_STOCK', undefined)).toBe(
      'Only the owner can stock this receipt.',
    );
    expect(procurementErrorCopy('DUPLICATE_INVOICE_NUMBER', undefined)).toBe(
      'This invoice number is already on file.',
    );
    expect(procurementErrorCopy('DISTRIBUTOR_NOT_FOUND', undefined)).toBe(
      'This distributor is no longer available.',
    );
    expect(procurementErrorCopy('PO_NOT_FOUND', undefined)).toBe(
      'This purchase order is no longer available.',
    );
    expect(procurementErrorCopy('PLAN_FEATURE_LOCKED', undefined)).toMatch(
      /Growth/,
    );
    expect(
      procurementErrorCopy('MODULE_NOT_IN_PLAN', undefined, 'reorder'),
    ).toMatch(/Growth/);
    expect(procurementErrorCopy('VALIDATION_ERROR', undefined)).toBe(
      'Check the highlighted fields and try again.',
    );
    expect(procurementErrorCopy('FORBIDDEN', undefined)).toBe(
      'You do not have permission to do that.',
    );
    expect(procurementErrorCopy('INSUFFICIENT_PERMISSIONS', undefined)).toBe(
      'You do not have permission to do that.',
    );
    expect(procurementErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(procurementErrorCopy(undefined, undefined)).toBe(
      'Unable to continue. Try again.',
    );
    expect(procurementErrorCopy('X', ' From Core ')).toBe('From Core');
    expect(failureResult('FORBIDDEN', undefined, null)).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    });
  });
});
