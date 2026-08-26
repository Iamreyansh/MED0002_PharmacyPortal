import { getRemoteUrl } from '@medmate/federation-config';
import { buildHostContext, useMfeEnvelope } from '@/modules/mfe';
import { MfeOutlet } from '@/modules/mfe';
import { getRemoteMeta } from '@/modules/mfe';
import { useSession } from '@/modules/session';
import { NotFoundPage } from '@/modules/not-found';
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
