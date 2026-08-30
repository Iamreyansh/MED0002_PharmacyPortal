import { useCallback, useMemo } from 'react';
import type {
  ProcurementCommand,
  ProcurementFeatureData,
  ProcurementScreen,
  ProcurementSubmitResult,
} from '@medmate/procurement-contract';
import { isPlanFeatureLocked } from '@medmate/procurement-contract';
import { track } from '@/modules/api';
import { procurementErrorCopy } from '@/modules/procurement/lib/errors';
import { submitDistributors } from '@/modules/procurement/lib/submit-distributors';
import { submitEditor } from '@/modules/procurement/lib/submit-editor';
import { submitPurchases } from '@/modules/procurement/lib/submit-purchases';
import { submitReorder } from '@/modules/procurement/lib/submit-reorder';
import { isPlanBelowMinimum, useSession } from '@/modules/session';
import { useToast } from '@/modules/shell';

const TOAST_BY_ACTION: Partial<Record<ProcurementCommand['action'], string>> = {
  create: 'Saved',
  saveAndStock: 'Receipt stocked',
  delete: 'Distributor removed',
  send: 'Purchase order sent',
  setPreferred: 'Preferred source saved',
};

function lockScreenFor(
  command: ProcurementCommand,
): 'distributors' | 'reorder' | undefined {
  if (command.screen === 'distributors') {
    return 'distributors';
  }
  if (command.screen === 'reorder') {
    return 'reorder';
  }
  return undefined;
}

function dispatchCommand(
  command: ProcurementCommand,
): Promise<ProcurementSubmitResult> {
  if (command.screen === 'purchases') {
    return submitPurchases(command);
  }
  if (command.screen === 'editor') {
    return submitEditor(command);
  }
  if (command.screen === 'distributors') {
    return submitDistributors(command);
  }
  return submitReorder(command);
}

function blocked(
  code: string,
  lockScreen?: 'distributors' | 'reorder',
): ProcurementSubmitResult {
  return {
    ok: false,
    code,
    formError: procurementErrorCopy(code, undefined, lockScreen),
  };
}

export function useProcurementFeature(
  screen: ProcurementScreen,
  options: { grnId?: string | null } = {},
): ProcurementFeatureData {
  const session = useSession();
  const { showToast } = useToast();
  const isOwner = session.role === 'pharmacy_owner';
  const canWrite = isOwner || session.role === 'pharmacy_staff';
  const canAccessGrowth = !isPlanBelowMinimum(session.plan, 'RETAIL_PRO');
  const canMutateDistributors = isOwner && canAccessGrowth;
  const canPriceCompare = isOwner && canAccessGrowth;
  const canRefreshReorder = isOwner && canAccessGrowth;
  const canSendPo = isOwner && canAccessGrowth;
  const canStockIn = isOwner;

  const onSubmit = useCallback(
    async (command: ProcurementCommand) => {
      const lockScreen = lockScreenFor(command);
      if (lockScreen && !canAccessGrowth) {
        track('plan_lock_shown', { code: lockScreen });
        return blocked('PLAN_FEATURE_LOCKED', lockScreen);
      }
      if (command.action === 'saveAndStock' && !canStockIn) {
        return blocked('STAFF_CANNOT_STOCK');
      }
      if (
        (command.action === 'create' && command.screen === 'distributors') ||
        command.action === 'patch' ||
        command.action === 'delete' ||
        command.action === 'setPreferred'
      ) {
        if (!canMutateDistributors) {
          return blocked('FORBIDDEN', 'distributors');
        }
      }
      if (command.action === 'loadPriceCompare' && !canPriceCompare) {
        return blocked('FORBIDDEN', 'distributors');
      }
      if (command.action === 'refresh' && !canRefreshReorder) {
        return blocked('FORBIDDEN', 'reorder');
      }
      if (
        (command.action === 'send' || command.action === 'createPo') &&
        !canSendPo
      ) {
        return blocked('FORBIDDEN', 'reorder');
      }
      const result = await dispatchCommand(command);
      if (!result.ok && isPlanFeatureLocked(result.code) && lockScreen) {
        track('plan_lock_shown', { code: lockScreen });
      }
      if (result.ok) {
        const toast =
          command.screen === 'purchases' && command.action === 'create'
            ? 'GRN created'
            : command.screen === 'distributors' && command.action === 'create'
              ? 'Distributor added'
              : TOAST_BY_ACTION[command.action];
        if (toast) {
          showToast(toast);
        }
      }
      return result;
    },
    [
      canAccessGrowth,
      canMutateDistributors,
      canPriceCompare,
      canRefreshReorder,
      canSendPo,
      canStockIn,
      showToast,
    ],
  );

  return useMemo(
    () => ({
      screen,
      onSubmit,
      role:
        session.role === 'pharmacy_staff' || session.role === 'pharmacy_owner'
          ? session.role
          : null,
      plan: session.plan,
      canWrite,
      canStockIn,
      canAccessGrowth,
      canMutateDistributors,
      canPriceCompare,
      canRefreshReorder,
      canSendPo,
      grnId: options.grnId ?? null,
    }),
    [
      canAccessGrowth,
      canMutateDistributors,
      canPriceCompare,
      canRefreshReorder,
      canSendPo,
      canStockIn,
      canWrite,
      onSubmit,
      options.grnId,
      screen,
      session.plan,
      session.role,
    ],
  );
}
