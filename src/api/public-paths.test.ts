import { describe, expect, it } from 'vitest';
import { isPublicAuthPath, isValidApiPath } from '@/api/public-paths';

describe('API path helpers', () => {
  it('accepts only /api/v1/ prefixed paths', () => {
    expect(isValidApiPath('/api/v1/auth/me')).toBe(true);
    expect(isValidApiPath('/api/v1')).toBe(false);
    expect(isValidApiPath('/v1/auth/me')).toBe(false);
  });

  it('recognises public auth paths including query strings', () => {
    expect(isPublicAuthPath('/api/v1/auth/refresh')).toBe(true);
    expect(isPublicAuthPath('/api/v1/auth/pharmacy/login')).toBe(true);
    expect(isPublicAuthPath('/api/v1/auth/pharmacy/pos-pin')).toBe(true);
    expect(isPublicAuthPath('/api/v1/pharmacy/register/verify-email')).toBe(
      true,
    );
    expect(isPublicAuthPath('/api/v1/auth/pharmacy/login?next=/')).toBe(true);
    expect(isPublicAuthPath('/api/v1/auth/me')).toBe(false);
  });
});
