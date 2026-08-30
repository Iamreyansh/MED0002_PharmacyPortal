import { useParams } from 'react-router-dom';
import type { BillingScreen } from '@medmate/billing-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { resolveRemoteUrl } from '@/config';
import { useBillingFeature } from '@/modules/billing/lib/billing-feature';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { useSession } from '@/modules/session';

export type BillingRemotePageProps = {
  screen: BillingScreen;
  loadRemote?: RemoteImporter;
};

function rootTestId(screen: BillingScreen): string {
  return `billing-${screen}-page`;
}

export function BillingRemotePage({
  screen,
  loadRemote,
}: BillingRemotePageProps) {
  const session = useSession();
  const { invoiceId, customerId } = useParams();
  const feature = useBillingFeature(screen, {
    invoiceId: screen === 'invoice-detail' ? (invoiceId ?? null) : null,
    customerId: screen === 'khata-detail' ? (customerId ?? null) : null,
  });
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('billing');
  const remoteUrl =
    configuredUrl ||
    (loadRemote ? '/__mfe/billing/mf-manifest.json' : undefined);

  return (
    <section className="page" data-testid={rootTestId(screen)}>
      <MfeOutlet
        key={`${screen}:${invoiceId ?? customerId ?? ''}`}
        remote="billing"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
