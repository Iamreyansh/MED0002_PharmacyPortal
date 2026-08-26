import { Navigate, useLocation } from 'react-router-dom';
import { HostApiLifecycle } from '@/api/HostApiLifecycle';
import { AppLayout } from '@/layout/AppLayout';
import { AppRoutes } from '@/app/routes';
import { SessionProvider, useSession } from '@/session/SessionProvider';
import type { PortalSession } from '@/session/session';
import type { ReactNode } from 'react';

function isPosPath(pathname: string): boolean {
  return pathname === '/pos' || pathname.startsWith('/pos/');
}

function isPublicAuthRoute(pathname: string): boolean {
  return pathname === '/login' || pathname === '/pos-login';
}

export function PosScopeGuard({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();
  if (
    session.tokenScope === 'pos' &&
    !isPosPath(location.pathname) &&
    !isPublicAuthRoute(location.pathname)
  ) {
    return <Navigate to="/pos" replace />;
  }
  return children;
}

export type AppProps = {
  session?: PortalSession;
};

export function App({ session }: AppProps = {}) {
  return (
    <SessionProvider session={session}>
      <HostApiLifecycle />
      <PosScopeGuard>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </PosScopeGuard>
    </SessionProvider>
  );
}
