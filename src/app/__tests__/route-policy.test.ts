import { describe, expect, it } from 'vitest';
import {
  isMarketplacePath,
  isOnboardingAllowedPath,
  isOnboardingStatus,
  isPosPath,
  isPublicAuthPathname,
  isSafeReturnPath,
  postAuthPath,
  readReturnParam,
} from '@/app/router/route-policy';
import { SESSION_FIXTURES } from '@/modules/session';

describe('route policy', () => {
  it('allows public auth routes and safe return paths', () => {
    expect(isPublicAuthPathname('/login')).toBe(true);
    expect(isPublicAuthPathname('/register')).toBe(true);
    expect(isPublicAuthPathname('/register/verify')).toBe(true);
    expect(isPublicAuthPathname('/pos-login')).toBe(true);
    expect(isPublicAuthPathname('/inventory')).toBe(false);
    expect(isSafeReturnPath('/invoices')).toBe(true);
    expect(isSafeReturnPath('https://evil.test')).toBe(false);
    expect(isSafeReturnPath('/register/verify')).toBe(false);
    expect(isSafeReturnPath('/login?next=/')).toBe(false);
    expect(isSafeReturnPath('//evil.test')).toBe(false);
    expect(isSafeReturnPath('/ok://x')).toBe(false);
    expect(isSafeReturnPath('/ok\\win')).toBe(false);
    expect(isOnboardingAllowedPath('/onboarding/status')).toBe(true);
    expect(isOnboardingAllowedPath('/')).toBe(true);
    expect(isOnboardingAllowedPath('/settings/profile')).toBe(true);
    expect(isOnboardingAllowedPath('/settings/profile/tax')).toBe(true);
    expect(isOnboardingAllowedPath('/subscription')).toBe(true);
    expect(isOnboardingAllowedPath('/subscription/plans')).toBe(true);
    expect(isOnboardingAllowedPath('/sessions')).toBe(true);
    expect(isOnboardingAllowedPath('/sessions/1')).toBe(true);
    expect(isOnboardingAllowedPath('/invoices')).toBe(false);
    expect(isPosPath('/pos')).toBe(true);
    expect(isPosPath('/pos/cart')).toBe(true);
    expect(isPosPath('/inventory')).toBe(false);
    expect(isOnboardingStatus(null)).toBe(false);
    expect(isOnboardingStatus('ACTIVE')).toBe(false);
    expect(isOnboardingStatus('KYC_SUBMITTED')).toBe(true);
    expect(isOnboardingStatus('REJECTED')).toBe(true);
    expect(isMarketplacePath('/rx-quotes')).toBe(true);
    expect(isMarketplacePath('/rx-quotes/1')).toBe(true);
    expect(isMarketplacePath('/orders')).toBe(true);
    expect(isMarketplacePath('/orders/1')).toBe(true);
    expect(isMarketplacePath('/inventory')).toBe(false);
    expect(isSafeReturnPath(null)).toBe(false);
    expect(isSafeReturnPath('')).toBe(false);
    expect(readReturnParam('?return=/invoices')).toBe('/invoices');
    expect(readReturnParam('?return=https://evil.test')).toBeNull();
  });

  it('sends POS and KYC sessions to the right home', () => {
    expect(postAuthPath(SESSION_FIXTURES['pos-scope'])).toBe('/pos');
    expect(postAuthPath(SESSION_FIXTURES['owner-pending-kyc'])).toBe(
      '/onboarding/status',
    );
    expect(postAuthPath(SESSION_FIXTURES['owner-free'], '/invoices')).toBe(
      '/invoices',
    );
    expect(postAuthPath(SESSION_FIXTURES['owner-free'], '/login')).toBe('/');
    expect(
      postAuthPath(SESSION_FIXTURES['owner-pending-kyc'], '/invoices'),
    ).toBe('/onboarding/status');
  });
});
