import type { RemoteImporter } from '@medmate/host-kit';
import { resolveRemoteUrl } from '@/config';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { usePosFeature } from '@/modules/pos/lib/pos-feature';
import { useSession } from '@/modules/session';

export type PosRemotePageProps = {
  loadRemote?: RemoteImporter;
};

export function PosRemotePage({ loadRemote }: PosRemotePageProps) {
  const session = useSession();
  const feature = usePosFeature();
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('pos');
  const remoteUrl =
    configuredUrl || (loadRemote ? '/__mfe/pos/mf-manifest.json' : undefined);

  return (
    <section className="page" data-testid="pos-page">
      <MfeOutlet
        remote="pos"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
