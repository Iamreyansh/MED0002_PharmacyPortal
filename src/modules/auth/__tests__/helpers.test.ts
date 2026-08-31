import { describe, expect, it } from 'vitest';
import { loginErrorCopy } from '@/modules/auth';
import { isUuid, isValidIdentifier, normalizeIdentifier } from '@/modules/auth';
import { formatIst } from '@/modules/session';

describe('auth helpers', () => {
  it('normalises identifiers and validates them', () => {
    expect(normalizeIdentifier('  A@B.C  ')).toBe('a@b.c');
    expect(normalizeIdentifier('+91 98765 43210')).toBe('+919876543210');
    expect(isValidIdentifier('priya@srirama.in')).toBe(true);
    expect(isValidIdentifier('+919876543210')).toBe(true);
    expect(isValidIdentifier('+911234567890')).toBe(false);
    expect(isValidIdentifier('not-an-id')).toBe(false);
    expect(isValidIdentifier('priya@bad')).toBe(false);
    expect(isUuid('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
    expect(isUuid('nope')).toBe(false);
  });

  it('builds login error copy for every branch', () => {
    expect(
      loginErrorCopy('ACCOUNT_LOCKED', 'Locked', { unlock_at: 'bad' }),
    ).toContain('Locked');
    expect(loginErrorCopy('ACCOUNT_LOCKED', ' ', null)).toBe('Account locked.');
    expect(loginErrorCopy('ACCOUNT_LOCKED', undefined, { unlock_at: 1 })).toBe(
      'Account locked.',
    );
    expect(loginErrorCopy('ACCOUNT_LOCKED', undefined, 'x')).toBe(
      'Account locked.',
    );
    expect(loginErrorCopy('INVALID_CREDENTIALS', undefined, null)).toBe(
      'Sign-in details were not recognised.',
    );
    expect(
      loginErrorCopy('INVALID_CREDENTIALS', 'Password does not match', null),
    ).toBe('Sign-in details were not recognised.');
    expect(
      loginErrorCopy('INVALID_CREDENTIALS', 'Invalid credentials', null),
    ).toBe('Invalid credentials');
    expect(loginErrorCopy('VALIDATION_ERROR', undefined, null)).toBe(
      'Check the highlighted fields and try again.',
    );
    expect(loginErrorCopy('OTHER', undefined, null)).toBe('OTHER');
    expect(loginErrorCopy(undefined, undefined, null)).toBe(
      'Unable to sign in. Try again.',
    );
    expect(loginErrorCopy(undefined, ' Custom ', null)).toBe('Custom');
  });
});

describe('formatIst', () => {
  it('returns null, raw, or formatted IST', () => {
    expect(formatIst(null)).toBeNull();
    expect(formatIst('')).toBeNull();
    expect(formatIst('not-a-date')).toBe('not-a-date');
    expect(formatIst('2026-08-26T18:00:00.000Z')).toMatch(/2026/);
  });
});
