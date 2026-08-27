import type { PharmacyStatus, PortalSession } from '@/modules/session';

export function isPosPath(pathname: string): boolean {
  return pathname === '/pos' || pathname.startsWith('/pos/');
}

export function isPublicAuthPathname(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname === '/pos-login' ||
    pathname === '/register' ||
    pathname === '/register/verify'
  );
}

export function isSafeReturnPath(path: string | null | undefined): boolean {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return false;
  }
  if (path.includes('://') || path.includes('\\')) {
    return false;
  }
  const [pathname = path] = path.split('?');
  if (isPublicAuthPathname(pathname)) {
    return false;
  }
  return true;
}

const ONBOARDING_STATUSES: readonly PharmacyStatus[] = [
  'PENDING_KYC',
  'KYC_SUBMITTED',
  'REJECTED',
];

export function isOnboardingStatus(status: PharmacyStatus | null): boolean {
  return status !== null && ONBOARDING_STATUSES.includes(status);
}

export function isOnboardingAllowedPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/onboarding') ||
    pathname === '/settings/profile' ||
    pathname.startsWith('/settings/profile/') ||
    pathname === '/subscription' ||
    pathname.startsWith('/subscription/') ||
    pathname === '/sessions' ||
    pathname.startsWith('/sessions/')
  );
}

export function isMarketplacePath(pathname: string): boolean {
  return (
    pathname === '/rx-quotes' ||
    pathname.startsWith('/rx-quotes/') ||
    pathname === '/orders' ||
    pathname.startsWith('/orders/')
  );
}

export function postAuthPath(
  session: PortalSession,
  returnTo?: string | null,
): string {
  if (session.tokenScope === 'pos') {
    return '/pos';
  }
  if (isOnboardingStatus(session.pharmacyStatus)) {
    return '/onboarding/status';
  }
  if (session.pharmacyStatus === 'ACTIVE' && isSafeReturnPath(returnTo)) {
    return returnTo as string;
  }
  return '/';
}

export function readReturnParam(search: string): string | null {
  const value = new URLSearchParams(search).get('return');
  return isSafeReturnPath(value) ? value : null;
}
