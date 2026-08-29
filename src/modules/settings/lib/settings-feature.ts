import { useCallback, useMemo } from 'react';
import type {
  SettingsCommand,
  SettingsFeatureData,
  SettingsScreen,
} from '@medmate/settings-contract';
import { can } from '@medmate/contracts';
import { useSession } from '@/modules/session';
import { useToast } from '@/modules/shell';
import { submitBank } from '@/modules/settings/lib/submit-bank';
import { submitCompleteness } from '@/modules/settings/lib/submit-completeness';
import { submitContact } from '@/modules/settings/lib/submit-contact';
import { submitLogo } from '@/modules/settings/lib/submit-logo';
import { submitProfile } from '@/modules/settings/lib/submit-profile';
import { submitRoles } from '@/modules/settings/lib/submit-roles';
import { submitStorefront } from '@/modules/settings/lib/submit-storefront';
import { submitTax } from '@/modules/settings/lib/submit-tax';
import { useStorefrontStatus } from '@/modules/settings/store/storefront-status';

const TOAST_BY_ACTION: Partial<Record<SettingsCommand['action'], string>> = {
  save: 'Profile saved',
  saveTax: 'Tax details saved',
  saveBank: 'Bank account submitted',
  verifyContact: 'Contact verified',
  uploadLogo: 'Logo uploaded',
  create: 'Role created',
  delete: 'Role deleted',
  savePermissions: 'Permissions saved',
};

export function useSettingsFeature(
  screen: SettingsScreen,
): SettingsFeatureData {
  const session = useSession();
  const storefront = useStorefrontStatus();
  const { showToast } = useToast();

  const onSubmit = useCallback(
    async (command: SettingsCommand) => {
      let result;
      if (command.screen === 'roles') {
        result = await submitRoles(command);
        if (result.ok) {
          const toast = TOAST_BY_ACTION[command.action];
          if (toast) {
            showToast(toast);
          }
        }
        return result;
      }
      if (command.screen === 'storefront') {
        result = await submitStorefront(command);
        if (result.ok) {
          showToast('Storefront updated');
        }
        return result;
      }
      if (command.action === 'load') {
        return submitProfile(command);
      }
      if (command.action === 'save') {
        result = await submitProfile(command);
      } else if (command.action === 'loadCompleteness') {
        return submitCompleteness(command);
      } else if (command.action === 'saveTax') {
        result = await submitTax(command);
      } else if (
        command.action === 'loadBank' ||
        command.action === 'saveBank'
      ) {
        result = await submitBank(command);
      } else if (command.action === 'uploadLogo') {
        result = await submitLogo(command);
      } else {
        result = await submitContact(command);
      }
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
      canWrite: session.role === 'pharmacy_owner',
      canEditPermissions:
        session.role === 'pharmacy_owner' ||
        can(session.permissions, 'staff:manage'),
      pharmacyName: session.pharmacyName,
      pharmacyStatus: session.pharmacyStatus,
      isOnline: storefront.isOnline,
      adminForcedOffline: storefront.adminForcedOffline,
    }),
    [
      onSubmit,
      screen,
      session.permissions,
      session.pharmacyName,
      session.pharmacyStatus,
      session.role,
      storefront.adminForcedOffline,
      storefront.isOnline,
    ],
  );
}
