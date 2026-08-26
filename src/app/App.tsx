import { Navigate, useLocation } from 'react-router-dom';
import { HostApiLifecycle } from '@/api/HostApiLifecycle';
import { hasStoredSession } from '@/api/token-store';
import {
  isMarketplacePath,
  isOnboardingStatus,
  isPosPath,
  isPublicAuthPathname,
  isSafeReturnPath,
  postAuthPath,
} from '@/app/route-policy';
import { AppLayout } from '@/layout/AppLayout';
import { AppRoutes } from '@/app/routes';
import { SessionProvider, useSession } from '@/session/SessionProvider';
import type { PharmacyOption, PortalSession } from '@/session/session';
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
    if (isPublicAuthPathname(pathname)) {
      return children;
    }
    const target = `${pathname}${location.search}`;
    const search = isSafeReturnPath(target)
      ? `?return=${encodeURIComponent(target)}`
      : '';
    return <Navigate to={`/login${search}`} replace />;
  }

  if (pathname === '/login' || pathname === '/register') {
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

  if (isOnboardingStatus(session.pharmacyStatus) && isMarketplacePath(pathname)) {
    return <Navigate to="/onboarding/status" replace />;
  }

  return children;
}

export type AppProps = {
  session?: PortalSession;
  pharmacies?: PharmacyOption[];
};

export function App({ session, pharmacies }: AppProps = {}) {
  return (
    <SessionProvider session={session} pharmacies={pharmacies}>
      <HostApiLifecycle />
      <AuthGuard>
        <PosScopeGuard>
          <AppLayout>
            <StatusGuard>
              <AppRoutes />
            </StatusGuard>
          </AppLayout>
        </PosScopeGuard>
      </AuthGuard>
    </SessionProvider>
  );
}
