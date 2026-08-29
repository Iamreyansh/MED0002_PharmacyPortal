import { useSearchParams } from 'react-router-dom';
import type { CatalogueScreen } from '@medmate/catalogue-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { resolveRemoteUrl } from '@/config';
import { buildHostContext, MfeOutlet, useMfeEnvelope } from '@/modules/mfe';
import { useSession } from '@/modules/session';
import { useCatalogueFeature } from '@/modules/catalogue/lib/catalogue-feature';

export type CatalogueRemotePageProps = {
  screen: CatalogueScreen;
  loadRemote?: RemoteImporter;
};

function rootTestId(screen: CatalogueScreen): string {
  return `catalogue-${screen}-page`;
}

export function CatalogueRemotePage({
  screen,
  loadRemote,
}: CatalogueRemotePageProps) {
  const session = useSession();
  const [params] = useSearchParams();
  const createFromMedicineId =
    screen === 'mapping' ? params.get('master_medicine_id') : null;
  const feature = useCatalogueFeature(screen, { createFromMedicineId });
  const data = useMfeEnvelope(
    feature,
    buildHostContext({
      permissions: [...session.permissions],
      pharmacyId: session.pharmacyId ?? undefined,
      userId: session.staffId ?? undefined,
    }),
  );
  const configuredUrl = resolveRemoteUrl('catalogue');
  const remoteUrl =
    configuredUrl ||
    (loadRemote ? '/__mfe/catalogue/mf-manifest.json' : undefined);

  return (
    <section className="page" data-testid={rootTestId(screen)}>
      <MfeOutlet
        key={`${screen}:${createFromMedicineId ?? ''}`}
        remote="catalogue"
        module="./Mfe"
        remoteUrl={remoteUrl}
        data={data}
        loadRemote={loadRemote}
      />
    </section>
  );
}
