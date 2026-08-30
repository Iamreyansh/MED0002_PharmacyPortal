import { Navigate, useParams } from 'react-router-dom';
import type { SupportScreen } from '@medmate/support-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { resolveRemoteUrl } from '@/config';
import { useSupportFeature } from '@/modules/support/lib/support-feature';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { useSession } from '@/modules/session';

export type SupportRemotePageProps = {
  screen: SupportScreen;
  loadRemote?: RemoteImporter;
};

function rootTestId(screen: SupportScreen): string {
  return `support-${screen}-page`;
}

export function SupportRemotePage({
  screen,
  loadRemote,
}: SupportRemotePageProps) {
  const session = useSession();
  const { id } = useParams();
  const feature = useSupportFeature(screen, {
    ticketId: screen === 'ticket-detail' ? (id ?? null) : null,
    articleId: screen === 'help-article' ? (id ?? null) : null,
  });
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('support');
  const remoteUrl =
    configuredUrl ||
    (loadRemote ? '/__mfe/support/mf-manifest.json' : undefined);

  return (
    <section className="page" data-testid={rootTestId(screen)}>
      <MfeOutlet
        key={`${screen}:${id ?? ''}`}
        remote="support"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}

export function SupportIndexRedirect() {
  return <Navigate to="/support/new" replace />;
}
