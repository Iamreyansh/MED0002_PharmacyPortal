import { describe, expect, it } from 'vitest';
import {
  isOnboardingAllowedPath,
  isPublicAuthPathname,
  isSafeReturnPath,
  postAuthPath,
} from '@/app/route-policy';
import { SESSION_FIXTURES } from '@/session/session';

describe('route policy', () => {
  it('allows public auth routes and safe return paths', () => {
    expect(isPublicAuthPathname('/login')).toBe(true);
    expect(isPublicAuthPathname('/register')).toBe(true);
    expect(isSafeReturnPath('/invoices')).toBe(true);
    expect(isSafeReturnPath('https://evil.test')).toBe(false);
    expect(isSafeReturnPath('/login')).toBe(false);
    expect(isOnboardingAllowedPath('/onboarding/status')).toBe(true);
  });

  it('sends POS and KYC sessions to the right home', () => {
    expect(postAuthPath(SESSION_FIXTURES['pos-scope'])).toBe('/pos');
    expect(postAuthPath(SESSION_FIXTURES['owner-pending-kyc'])).toBe(
      '/onboarding/status',
    );
    expect(postAuthPath(SESSION_FIXTURES['owner-free'], '/invoices')).toBe(
      '/invoices',
    );
  });
});
