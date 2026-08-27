import type { OnboardingScreen } from '@medmate/onboarding-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { Navigate } from 'react-router-dom';
import { postAuthPath } from '@/app/router/route-policy';
import { resolveRemoteUrl } from '@/config';
import { useOnboardingFeature } from '@/modules/onboarding/lib/onboarding-feature';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { useSession } from '@/modules/session';

export type OnboardingRemotePageProps = {
  screen: OnboardingScreen;
  loadRemote?: RemoteImporter;
};

function rootTestId(screen: OnboardingScreen): string {
  if (screen === 'register') {
    return 'register-page';
  }
  if (screen === 'verify') {
    return 'register-verify-page';
  }
  if (screen === 'status') {
    return 'onboarding-status-page';
  }
  return 'onboarding-kyc-page';
}

function stageClass(screen: OnboardingScreen): string {
  if (screen === 'register' || screen === 'verify') {
    return 'auth-page auth-page--wide';
  }
  return 'page';
}

export function OnboardingRemotePage({
  screen,
  loadRemote,
}: OnboardingRemotePageProps) {
  const session = useSession();
  const feature = useOnboardingFeature(screen);
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('onboarding');
  const remoteUrl =
    configuredUrl ||
    (loadRemote ? '/__mfe/onboarding/mf-manifest.json' : undefined);

  if ((screen === 'register' || screen === 'verify') && session.authenticated) {
    return <Navigate to={postAuthPath(session)} replace />;
  }

  return (
    <section className={stageClass(screen)} data-testid={rootTestId(screen)}>
      <MfeOutlet
        key={screen}
        remote="onboarding"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
