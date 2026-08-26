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
    <MfeOutlet
      remote={remote.name}
      module={remote.module}
      remoteUrl={remoteUrl}
      data={data}
      loadRemote={loadRemote}
    />
  );
}
