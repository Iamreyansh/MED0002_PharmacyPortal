import type { SubscriptionScreen } from '@medmate/subscription-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { resolveRemoteUrl } from '@/config';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { useSession } from '@/modules/session';
import { useSubscriptionFeature } from '@/modules/subscription/lib/subscription-feature';

export type SubscriptionRemotePageProps = {
  screen: SubscriptionScreen;
  loadRemote?: RemoteImporter;
};

function rootTestId(screen: SubscriptionScreen): string {
  return `subscription-${screen}-page`;
}

export function SubscriptionRemotePage({
  screen,
  loadRemote,
}: SubscriptionRemotePageProps) {
  const session = useSession();
  const feature = useSubscriptionFeature(screen);
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('subscription');
  const remoteUrl =
    configuredUrl ||
    (loadRemote ? '/__mfe/subscription/mf-manifest.json' : undefined);

  return (
    <section className="page" data-testid={rootTestId(screen)}>
      <MfeOutlet
        key={screen}
        remote="subscription"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
