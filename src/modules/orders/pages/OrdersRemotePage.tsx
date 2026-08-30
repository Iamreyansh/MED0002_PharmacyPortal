import { useParams } from 'react-router-dom';
import type { OrdersScreen } from '@medmate/orders-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { resolveRemoteUrl } from '@/config';
import { isUuid } from '@/modules/auth';
import { useOrdersFeature } from '@/modules/orders/lib/orders-feature';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { NotFoundPage } from '@/modules/not-found';
import { useSession } from '@/modules/session';

export type OrdersRemotePageProps = {
  screen: OrdersScreen;
  loadRemote?: RemoteImporter;
};

function rootTestId(screen: OrdersScreen): string {
  return `orders-${screen}-page`;
}

export function OrdersRemotePage({
  screen,
  loadRemote,
}: OrdersRemotePageProps) {
  const session = useSession();
  const { orderId } = useParams();
  const feature = useOrdersFeature(screen, {
    orderId: screen === 'order-actions' ? (orderId ?? null) : null,
  });
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('orders');
  const remoteUrl =
    configuredUrl ||
    (loadRemote ? '/__mfe/orders/mf-manifest.json' : undefined);

  if (screen === 'order-actions' && (!orderId || !isUuid(orderId))) {
    return <NotFoundPage />;
  }

  return (
    <section className="page" data-testid={rootTestId(screen)}>
      <MfeOutlet
        key={`${screen}:${orderId ?? ''}`}
        remote="orders"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
