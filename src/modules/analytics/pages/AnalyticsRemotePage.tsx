import type { RemoteImporter } from '@medmate/host-kit';
import { resolveRemoteUrl } from '@/config';
import { useAnalyticsFeature } from '@/modules/analytics/lib/analytics-feature';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { useSession } from '@/modules/session';

export type AnalyticsRemotePageProps = {
  loadRemote?: RemoteImporter;
};

export function AnalyticsRemotePage({ loadRemote }: AnalyticsRemotePageProps) {
  const session = useSession();
  const feature = useAnalyticsFeature();
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('analytics');
  const remoteUrl =
    configuredUrl ||
    (loadRemote ? '/__mfe/analytics/mf-manifest.json' : undefined);

  return (
    <section className="page" data-testid="analytics-analytics-page">
      <MfeOutlet
        remote="analytics"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
