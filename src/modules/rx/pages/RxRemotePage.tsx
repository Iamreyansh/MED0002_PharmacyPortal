import { useParams } from 'react-router-dom';
import type { RxScreen } from '@medmate/rx-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { resolveRemoteUrl } from '@/config';
import { useRxFeature } from '@/modules/rx/lib/rx-feature';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { useSession } from '@/modules/session';

export type RxRemotePageProps = {
  screen: RxScreen;
  loadRemote?: RemoteImporter;
};

function rootTestId(screen: RxScreen): string {
  return `rx-${screen}-page`;
}

export function RxRemotePage({ screen, loadRemote }: RxRemotePageProps) {
  const session = useSession();
  const { rxId } = useParams();
  const feature = useRxFeature(screen, {
    rxId: screen === 'detail' ? (rxId ?? null) : null,
  });
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('rx');
  const remoteUrl =
    configuredUrl || (loadRemote ? '/__mfe/rx/mf-manifest.json' : undefined);

  return (
    <section className="page" data-testid={rootTestId(screen)}>
      <MfeOutlet
        key={`${screen}:${rxId ?? ''}`}
        remote="rx"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
