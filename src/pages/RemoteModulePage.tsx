import { getRemoteUrl } from '@medmate/federation-config';
import { buildHostContext, useMfeEnvelope } from '@/host';
import { MfeOutlet } from '@/mfe/MfeOutlet';
import { getRemoteMeta } from '@/mfe/registry';
import { useSession } from '@/session/SessionProvider';
import { NotFoundPage } from '@/pages/NotFoundPage';
import type { RemoteImporter } from '@medmate/host-kit';

export type RemoteModulePageProps = {
  remoteName: string;
  loadRemote?: RemoteImporter;
};

export function RemoteModulePage({
  remoteName,
  loadRemote,
}: RemoteModulePageProps) {
  const remote = getRemoteMeta(remoteName);
  const session = useSession();
  const data = useMfeEnvelope(
    {},
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );

  if (!remote) {
    return <NotFoundPage />;
  }

  const remoteUrl = getRemoteUrl(
    remote.name,
    import.meta.env as Record<string, string | undefined>,
  );

  return (
    <div data-testid={`remote-page-${remote.name}`}>
      <MfeOutlet
        key={session.pharmacyId ?? 'none'}
        remote={remote.name}
        module={remote.module}
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </div>
  );
}
