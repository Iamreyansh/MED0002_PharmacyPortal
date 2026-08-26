import { Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/layout/AppLayout';
import { AppRoutes } from '@/app/routes';
import { SessionProvider, useSession } from '@/session/SessionProvider';
import type { PortalSession } from '@/session/session';
import type { ReactNode } from 'react';

function isPosPath(pathname: string): boolean {
  return pathname === '/pos' || pathname.startsWith('/pos/');
}

export function PosScopeGuard({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();
  if (session.tokenScope === 'pos' && !isPosPath(location.pathname)) {
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
      <PosScopeGuard>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </PosScopeGuard>
    </SessionProvider>
  );
}
