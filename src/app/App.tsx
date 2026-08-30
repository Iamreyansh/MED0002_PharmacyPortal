import { HostApiLifecycle } from '@/modules/api';
import { AuthGuard, PosScopeGuard, StatusGuard } from '@/app/guards/AuthGuard';
import { AppLayout } from '@/modules/shell';
import { AppRoutes } from '@/app/router/routes';
import { DeviceTokenLifecycle, SessionProvider } from '@/modules/session';
import type { PharmacyOption, PortalSession } from '@/modules/session';

export { AuthGuard, PosScopeGuard, StatusGuard } from '@/app/guards/AuthGuard';

export type AppProps = {
  session?: PortalSession;
  pharmacies?: PharmacyOption[];
};

export function App({ session, pharmacies }: AppProps = {}) {
  return (
    <SessionProvider session={session} pharmacies={pharmacies}>
      <HostApiLifecycle />
      <DeviceTokenLifecycle />
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
