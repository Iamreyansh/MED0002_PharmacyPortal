import { describe, expect, it } from 'vitest';
import {
  catalogueErrorCopy,
  failureResult,
  fieldErrorsFromDetails,
} from '@/modules/catalogue/lib/errors';

describe('catalogue errors', () => {
  it('maps details and copy without treating permissions as upgrades', () => {
    expect(fieldErrorsFromDetails({ pharmacy_price: 'Required' })).toEqual({
      pharmacy_price: 'Required',
    });
    expect(fieldErrorsFromDetails(null)).toBeUndefined();
    expect(fieldErrorsFromDetails([])).toBeUndefined();
    expect(fieldErrorsFromDetails({ pharmacy_price: 1 })).toBeUndefined();
    expect(catalogueErrorCopy('QUERY_TOO_SHORT', undefined)).toBe(
      'Check the search or highlighted fields and try again.',
    );
    expect(catalogueErrorCopy('VALIDATION_ERROR', undefined)).toBe(
      'Check the search or highlighted fields and try again.',
    );
    expect(catalogueErrorCopy('PRICE_ABOVE_MRP', undefined)).toBe(
      'Price cannot exceed master MRP.',
    );
    expect(
      catalogueErrorCopy('SCHEDULE_X_NOT_AVAILABLE_ONLINE', undefined),
    ).toBe('Schedule X medicines cannot be sold online.');
    expect(catalogueErrorCopy('MAPPING_NOT_FOUND', undefined)).toBe(
      'This mapping is no longer available.',
    );
    expect(catalogueErrorCopy('MAPPING_ALREADY_EXISTS', undefined)).toBe(
      'This medicine is already mapped.',
    );
    expect(catalogueErrorCopy('FORBIDDEN', undefined)).toBe(
      'You do not have permission to do that.',
    );
    expect(catalogueErrorCopy('INSUFFICIENT_PERMISSIONS', undefined)).toBe(
      'You do not have permission to do that.',
    );
    expect(catalogueErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(catalogueErrorCopy(undefined, undefined)).toBe(
      'Unable to continue. Try again.',
    );
    expect(catalogueErrorCopy('X', ' From Core ')).toBe('From Core');
    expect(failureResult('FORBIDDEN', undefined, null)).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    });
  });
});
