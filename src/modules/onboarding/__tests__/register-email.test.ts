import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearRegisterEmail,
  readRegisterEmail,
  writeRegisterEmail,
} from '@/modules/onboarding/lib/register-email';

afterEach(() => {
  clearRegisterEmail();
  vi.unstubAllGlobals();
});

describe('register-email', () => {
  it('writes, reads, and clears the owner email', () => {
    expect(readRegisterEmail()).toBe('');
    writeRegisterEmail('priya@srirama.in');
    expect(readRegisterEmail()).toBe('priya@srirama.in');
    clearRegisterEmail();
    expect(readRegisterEmail()).toBe('');
  });

  it('ignores non-string sessionStorage values', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => 1,
      setItem: () => undefined,
      removeItem: () => undefined,
    });
    expect(readRegisterEmail()).toBe('');
  });

  it('survives blocked sessionStorage', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    });
    expect(readRegisterEmail()).toBe('');
    writeRegisterEmail('a@b.c');
    clearRegisterEmail();
  });
});
