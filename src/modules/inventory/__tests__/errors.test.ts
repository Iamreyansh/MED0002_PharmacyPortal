import { describe, expect, it } from 'vitest';
import {
  failureResult,
  fieldErrorsFromDetails,
  inventoryErrorCopy,
} from '@/modules/inventory/lib/errors';

describe('inventory errors', () => {
  it('maps details and copy without treating permissions as upgrades', () => {
    expect(fieldErrorsFromDetails({ quantity: 'Required' })).toEqual({
      quantity: 'Required',
    });
    expect(fieldErrorsFromDetails(null)).toBeUndefined();
    expect(fieldErrorsFromDetails([])).toBeUndefined();
    expect(fieldErrorsFromDetails({ quantity: 1 })).toBeUndefined();
    expect(inventoryErrorCopy('PRODUCT_NOT_FOUND', undefined)).toBe(
      'This product is no longer available.',
    );
    expect(inventoryErrorCopy('BATCH_NOT_FOUND', undefined)).toBe(
      'This batch is no longer available.',
    );
    expect(inventoryErrorCopy('RACK_NOT_FOUND', undefined)).toBe(
      'This rack is no longer available.',
    );
    expect(inventoryErrorCopy('STAFF_CANNOT_WRITE_OFF', undefined)).toBe(
      'Only the owner can write off a batch.',
    );
    expect(inventoryErrorCopy('PLAN_FEATURE_LOCKED', undefined)).toMatch(
      /Growth/,
    );
    expect(inventoryErrorCopy('MODULE_NOT_IN_PLAN', undefined)).toMatch(
      /Growth/,
    );
    expect(inventoryErrorCopy('VALIDATION_ERROR', undefined)).toBe(
      'Check the highlighted fields and try again.',
    );
    expect(inventoryErrorCopy('FORBIDDEN', undefined)).toBe(
      'You do not have permission to do that.',
    );
    expect(inventoryErrorCopy('INSUFFICIENT_PERMISSIONS', undefined)).toBe(
      'You do not have permission to do that.',
    );
    expect(inventoryErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(inventoryErrorCopy(undefined, undefined)).toBe(
      'Unable to continue. Try again.',
    );
    expect(inventoryErrorCopy('X', ' From Core ')).toBe('From Core');
    expect(failureResult('FORBIDDEN', undefined, null)).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    });
  });
});
