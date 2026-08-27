import type { SettingsScreen } from '@medmate/settings-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { resolveRemoteUrl } from '@/config';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { useSession } from '@/modules/session';
import { useSettingsFeature } from '@/modules/settings/lib/settings-feature';

export type SettingsRemotePageProps = {
  screen: SettingsScreen;
  loadRemote?: RemoteImporter;
};

function rootTestId(screen: SettingsScreen): string {
  return screen === 'profile'
    ? 'settings-profile-page'
    : 'settings-storefront-page';
}

export function SettingsRemotePage({
  screen,
  loadRemote,
}: SettingsRemotePageProps) {
  const session = useSession();
  const feature = useSettingsFeature(screen);
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('settings');
  const remoteUrl =
    configuredUrl ||
    (loadRemote ? '/__mfe/settings/mf-manifest.json' : undefined);

  return (
    <section className="page" data-testid={rootTestId(screen)}>
      <MfeOutlet
        key={screen}
        remote="settings"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
