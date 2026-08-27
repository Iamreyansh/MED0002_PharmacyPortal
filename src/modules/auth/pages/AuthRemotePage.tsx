import type { AuthPortalType } from '@medmate/auth-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { Navigate } from 'react-router-dom';
import { postAuthPath } from '@/app/router/route-policy';
import { resolveRemoteUrl } from '@/config';
import { useAuthFeature } from '@/modules/auth/lib/auth-feature';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { useSession } from '@/modules/session';

export type AuthRemotePageProps = {
  portalType: Extract<AuthPortalType, 'pharmacy' | 'pos' | 'sessions'>;
  loadRemote?: RemoteImporter;
};

function rootTestId(portalType: AuthRemotePageProps['portalType']): string {
  if (portalType === 'pharmacy') {
    return 'login-page';
  }
  if (portalType === 'pos') {
    return 'pos-login-page';
  }
  return 'sessions-page';
}

function stageClass(portalType: AuthRemotePageProps['portalType']): string {
  if (portalType === 'sessions') {
    return 'page';
  }
  if (portalType === 'pharmacy') {
    return 'auth-page auth-page--wide';
  }
  return 'auth-page';
}

export function AuthRemotePage({
  portalType,
  loadRemote,
}: AuthRemotePageProps) {
  const session = useSession();
  const feature = useAuthFeature(portalType);
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('auth');
  const remoteUrl =
    configuredUrl || (loadRemote ? '/__mfe/auth/mf-manifest.json' : undefined);

  if (portalType === 'pharmacy') {
    if (session.authenticated && session.tokenScope === 'pos') {
      return <Navigate to="/pos" replace />;
    }
    if (session.authenticated) {
      return <Navigate to={postAuthPath(session)} replace />;
    }
  }
  if (portalType === 'pos' && session.authenticated) {
    return <Navigate to="/pos" replace />;
  }

  return (
    <section
      className={stageClass(portalType)}
      data-testid={rootTestId(portalType)}
    >
      <MfeOutlet
        key={portalType}
        remote="auth"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
