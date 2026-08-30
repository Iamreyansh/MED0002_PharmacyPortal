import { useParams } from 'react-router-dom';
import type { ProcurementScreen } from '@medmate/procurement-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { resolveRemoteUrl } from '@/config';
import { useProcurementFeature } from '@/modules/procurement/lib/procurement-feature';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { useSession } from '@/modules/session';

export type ProcurementRemotePageProps = {
  screen: ProcurementScreen;
  loadRemote?: RemoteImporter;
};

function rootTestId(screen: ProcurementScreen): string {
  return `procurement-${screen}-page`;
}

export function ProcurementRemotePage({
  screen,
  loadRemote,
}: ProcurementRemotePageProps) {
  const session = useSession();
  const { grnId } = useParams();
  const feature = useProcurementFeature(screen, {
    grnId: screen === 'editor' ? (grnId ?? null) : null,
  });
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('procurement');
  const remoteUrl =
    configuredUrl ||
    (loadRemote ? '/__mfe/procurement/mf-manifest.json' : undefined);

  return (
    <section className="page" data-testid={rootTestId(screen)}>
      <MfeOutlet
        key={`${screen}:${grnId ?? ''}`}
        remote="procurement"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
