import { Navigate, useLocation } from 'react-router-dom';
import { hasStoredSession } from '@/modules/api';
import {
  isMarketplacePath,
  isOnboardingStatus,
  isPosPath,
  isPublicAuthPathname,
  isPublicContentPathname,
  isSafeReturnPath,
  postAuthPath,
} from '@/app/router/route-policy';
import { useSession } from '@/modules/session';
import type { ReactNode } from 'react';

export function PosScopeGuard({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();
  if (
    session.tokenScope === 'pos' &&
    !isPosPath(location.pathname) &&
    location.pathname !== '/pos-login'
  ) {
    return <Navigate to="/pos" replace />;
  }
  return children;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();
  const pathname = location.pathname;

  if (!session.authenticated) {
    if (hasStoredSession()) {
      return children;
    }
    if (isPublicAuthPathname(pathname) || isPublicContentPathname(pathname)) {
      return children;
    }
    const target = `${pathname}${location.search}`;
    const search = isSafeReturnPath(target)
      ? `?return=${encodeURIComponent(target)}`
      : '';
    return <Navigate to={`/login${search}`} replace />;
  }

  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/register/verify'
  ) {
    return <Navigate to={postAuthPath(session)} replace />;
  }

  return children;
}

export function StatusGuard({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();
  const pathname = location.pathname;

  if (!session.authenticated) {
    return children;
  }

  if (session.pharmacyStatus === 'SUSPENDED' && isMarketplacePath(pathname)) {
    return (
      <section className="page" data-testid="suspended-block">
        <h1>Pharmacy suspended</h1>
        <p>Marketplace actions are blocked while this pharmacy is suspended.</p>
      </section>
    );
  }

  if (
    isOnboardingStatus(session.pharmacyStatus) &&
    isMarketplacePath(pathname)
  ) {
    return <Navigate to="/onboarding/status" replace />;
  }

  return children;
}
