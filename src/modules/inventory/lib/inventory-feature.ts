import { useCallback, useMemo } from 'react';
import type {
  InventoryCommand,
  InventoryFeatureData,
  InventoryScreen,
  InventorySubmitResult,
} from '@medmate/inventory-contract';
import { track } from '@/modules/api';
import { inventoryErrorCopy } from '@/modules/inventory/lib/errors';
import { submitBatches } from '@/modules/inventory/lib/submit-batches';
import { submitExpiry } from '@/modules/inventory/lib/submit-expiry';
import { submitList } from '@/modules/inventory/lib/submit-list';
import { submitProduct } from '@/modules/inventory/lib/submit-product';
import { submitRacks } from '@/modules/inventory/lib/submit-racks';
import {
  hasPermission,
  isPlanBelowMinimum,
  useSession,
} from '@/modules/session';
import { useStorefrontStatus } from '@/modules/settings';
import { useToast } from '@/modules/shell';

const TOAST_BY_ACTION: Partial<Record<InventoryCommand['action'], string>> = {
  addBatch: 'Batch added',
  adjustBatch: 'Batch updated',
  writeOff: 'Batch written off',
  patchDetails: 'Details saved',
  patchRack: 'Rack updated',
  patchProduct: 'Product updated',
  create: 'Rack created',
  delete: 'Rack removed',
  assign: 'Rack assigned',
};

function dispatchCommand(
  command: InventoryCommand,
): Promise<InventorySubmitResult> {
  if (command.screen === 'list') {
    return submitList(command);
  }
  if (command.screen === 'expiry') {
    return submitExpiry(command);
  }
  if (command.screen === 'racks') {
    return submitRacks(command);
  }
  if (
    command.action === 'loadBatches' ||
    command.action === 'addBatch' ||
    command.action === 'adjustBatch' ||
    command.action === 'writeOff'
  ) {
    return submitBatches(command);
  }
  return submitProduct(command);
}

export function useInventoryFeature(
  screen: InventoryScreen,
  options: { productId?: string | null } = {},
): InventoryFeatureData {
  const session = useSession();
  const { showToast } = useToast();
  const storefront = useStorefrontStatus();
  const isOwner = session.role === 'pharmacy_owner';
  const canWrite = hasPermission(session, 'inventory:write');
  const canToggleOnline =
    isOwner && !isPlanBelowMinimum(session.plan, 'RETAIL_PRO');

  const onSubmit = useCallback(
    async (command: InventoryCommand) => {
      if (
        command.screen === 'detail' &&
        command.action === 'patchProduct' &&
        command.values.is_online_visible === true &&
        !canToggleOnline
      ) {
        const code = isOwner ? 'PLAN_FEATURE_LOCKED' : 'FORBIDDEN';
        track('plan_lock_shown', { code: 'online_visibility' });
        return {
          ok: false as const,
          code,
          formError: inventoryErrorCopy(code, undefined),
        };
      }
      const result = await dispatchCommand(command);
      if (
        !result.ok &&
        command.action === 'patchProduct' &&
        (result.code === 'PLAN_FEATURE_LOCKED' ||
          result.code === 'MODULE_NOT_IN_PLAN')
      ) {
        track('plan_lock_shown', { code: 'online_visibility' });
      }
      if (result.ok) {
        const toast = TOAST_BY_ACTION[command.action];
        if (toast) {
          showToast(toast);
        }
      }
      return result;
    },
    [canToggleOnline, isOwner, showToast],
  );

  return useMemo(
    () => ({
      screen,
      onSubmit,
      role: session.role,
      plan: session.plan,
      canWrite,
      canPatchDetails: isOwner,
      canWriteOff: isOwner,
      canManageRacks: isOwner,
      canToggleOnline,
      storefrontOnline: storefront.isOnline,
      productId: options.productId ?? null,
    }),
    [
      canToggleOnline,
      canWrite,
      isOwner,
      onSubmit,
      options.productId,
      screen,
      session.plan,
      session.role,
      storefront.isOnline,
    ],
  );
}
