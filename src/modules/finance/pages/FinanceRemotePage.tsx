import { useParams } from 'react-router-dom';
import type { FinanceScreen } from '@medmate/finance-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { resolveRemoteUrl } from '@/config';
import { useFinanceFeature } from '@/modules/finance/lib/finance-feature';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { useSession } from '@/modules/session';

export type FinanceRemotePageProps = {
  screen: FinanceScreen;
  loadRemote?: RemoteImporter;
};

function rootTestId(screen: FinanceScreen): string {
  return `finance-${screen}-page`;
}

export function FinanceRemotePage({
  screen,
  loadRemote,
}: FinanceRemotePageProps) {
  const session = useSession();
  const { id } = useParams();
  const feature = useFinanceFeature(screen, {
    settlementId: screen === 'settlement-detail' ? (id ?? null) : null,
  });
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('finance');
  const remoteUrl =
    configuredUrl ||
    (loadRemote ? '/__mfe/finance/mf-manifest.json' : undefined);

  return (
    <section className="page" data-testid={rootTestId(screen)}>
      <MfeOutlet
        key={`${screen}:${id ?? ''}`}
        remote="finance"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
