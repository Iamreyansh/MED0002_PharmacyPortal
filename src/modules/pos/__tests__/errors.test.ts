import { describe, expect, it } from 'vitest';
import {
  failureResult,
  fieldErrorsFromDetails,
  posErrorCopy,
} from '@/modules/pos/lib/errors';
import { asCollection, asObject } from '@/modules/pos/lib/query';
import {
  cartItemPath,
  cartPath,
  isPharmacyPosApiPath,
} from '@/modules/pos/lib/paths';

describe('pos errors and helpers', () => {
  it('maps details and copy', () => {
    expect(fieldErrorsFromDetails({ quantity: 'Required' })).toEqual({
      quantity: 'Required',
    });
    expect(fieldErrorsFromDetails(null)).toBeUndefined();
    expect(fieldErrorsFromDetails([])).toBeUndefined();
    expect(fieldErrorsFromDetails({ quantity: 1 })).toBeUndefined();
    expect(posErrorCopy('INSUFFICIENT_STOCK', undefined)).toMatch(/stock/);
    expect(posErrorCopy('CART_NOT_FOUND', undefined)).toMatch(/new cart/);
    expect(posErrorCopy('CART_EXPIRED', undefined)).toMatch(/new cart/);
    expect(posErrorCopy('EMPTY_CART', undefined)).toMatch(/product/);
    expect(posErrorCopy('POS_TOKEN_RESTRICTED', undefined)).toMatch(
      /full login/,
    );
    expect(posErrorCopy('MODULE_NOT_IN_PLAN', undefined)).toMatch(/plan/);
    expect(posErrorCopy('CREDIT_REQUIRES_NAMED_CUSTOMER', undefined)).toMatch(
      /customer/,
    );
    expect(posErrorCopy('RX_PRESCRIBER_REQUIRED', undefined)).toMatch(/doctor/);
    expect(posErrorCopy('VALIDATION_ERROR', undefined)).toMatch(/fields/);
    expect(posErrorCopy('FORBIDDEN', undefined)).toMatch(/permission/);
    expect(posErrorCopy('INSUFFICIENT_PERMISSIONS', undefined)).toMatch(
      /permission/,
    );
    expect(posErrorCopy('NOPE', undefined)).toBe('NOPE');
    expect(posErrorCopy(undefined, undefined)).toMatch(/Unable/);
    expect(posErrorCopy('X', ' From Core ')).toBe('From Core');
    expect(failureResult('FORBIDDEN', undefined, null)).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    });
  });

  it('parses objects and collections', () => {
    expect(asObject(null)).toBeNull();
    expect(asObject([])).toBeNull();
    expect(asObject({ cart_id: '1' })).toEqual({ cart_id: '1' });
    expect(asCollection([1], [])).toEqual([1]);
    expect(asCollection({ items: [1] }, ['items'])).toEqual([1]);
    expect(asCollection({}, ['items'])).toEqual([]);
    expect(cartPath('a b')).toContain('a%20b');
    expect(cartItemPath('c', 'i')).toContain('/items/');
    expect(isPharmacyPosApiPath('/api/v1/pharmacy/pos/cart')).toBe(true);
  });
});
