import { useCallback, useMemo } from 'react';
import type {
  CatalogueCommand,
  CatalogueFeatureData,
  CatalogueScreen,
} from '@medmate/catalogue-contract';
import { useSession } from '@/modules/session';
import { useToast } from '@/modules/shell';
import { submitMapping } from '@/modules/catalogue/lib/submit-mapping';
import { submitSearch } from '@/modules/catalogue/lib/submit-search';

const TOAST_BY_ACTION: Partial<Record<CatalogueCommand['action'], string>> = {
  create: 'Mapping created',
  update: 'Mapping updated',
  delete: 'Mapping removed',
};

export function useCatalogueFeature(
  screen: CatalogueScreen,
  options: { createFromMedicineId?: string | null } = {},
): CatalogueFeatureData {
  const session = useSession();
  const { showToast } = useToast();
  const isOwner = session.role === 'pharmacy_owner';

  const onSubmit = useCallback(
    async (command: CatalogueCommand) => {
      const result =
        command.screen === 'mapping'
          ? await submitMapping(command)
          : await submitSearch(command);
      if (result.ok) {
        const toast = TOAST_BY_ACTION[command.action];
        if (toast) {
          showToast(toast);
        }
      }
      return result;
    },
    [showToast],
  );

  return useMemo(
    () => ({
      screen,
      onSubmit,
      role: session.role,
      canCreate: isOwner,
      canDelete: isOwner,
      canPatch:
        session.role === 'pharmacy_owner' || session.role === 'pharmacy_staff',
      createFromMedicineId: options.createFromMedicineId ?? null,
    }),
    [isOwner, onSubmit, options.createFromMedicineId, screen, session.role],
  );
}
