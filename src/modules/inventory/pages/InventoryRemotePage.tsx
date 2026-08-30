import { useParams } from 'react-router-dom';
import type { InventoryScreen } from '@medmate/inventory-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { resolveRemoteUrl } from '@/config';
import { useInventoryFeature } from '@/modules/inventory/lib/inventory-feature';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { useSession } from '@/modules/session';

export type InventoryRemotePageProps = {
  screen: InventoryScreen;
  loadRemote?: RemoteImporter;
};

function rootTestId(screen: InventoryScreen): string {
  return `inventory-${screen}-page`;
}

export function InventoryRemotePage({
  screen,
  loadRemote,
}: InventoryRemotePageProps) {
  const session = useSession();
  const { productId } = useParams();
  const feature = useInventoryFeature(screen, {
    productId: screen === 'detail' ? (productId ?? null) : null,
  });
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('inventory');
  const remoteUrl =
    configuredUrl ||
    (loadRemote ? '/__mfe/inventory/mf-manifest.json' : undefined);

  return (
    <section className="page" data-testid={rootTestId(screen)}>
      <MfeOutlet
        key={`${screen}:${productId ?? ''}`}
        remote="inventory"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
