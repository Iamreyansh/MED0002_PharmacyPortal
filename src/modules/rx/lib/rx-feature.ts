import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  RxCommand,
  RxFeatureData,
  RxScreen,
  RxSubmitResult,
} from '@medmate/rx-contract';
import { isPlanFeatureLocked, rxLockCopy } from '@medmate/rx-contract';
import { track } from '@/modules/api';
import { rxErrorCopy } from '@/modules/rx/lib/errors';
import { submitDrugRegister } from '@/modules/rx/lib/submit-drug-register';
import { submitPrescriptions } from '@/modules/rx/lib/submit-prescriptions';
import {
  hasPermission,
  isPlanBelowMinimum,
  useSession,
} from '@/modules/session';
import { useToast } from '@/modules/shell';

const TOAST_BY_ACTION: Partial<Record<RxCommand['action'], string>> = {
  approve: 'Prescription approved',
  reject: 'Prescription rejected',
  dispense: 'Dispensed',
};

function dispatchCommand(command: RxCommand): Promise<RxSubmitResult> {
  if (command.screen === 'drug-register') {
    return submitDrugRegister(command);
  }
  return submitPrescriptions(command);
}

export function useRxFeature(
  screen: RxScreen,
  options: { rxId?: string | null } = {},
): RxFeatureData {
  const session = useSession();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isOwner = session.role === 'pharmacy_owner';
  const queueLocked =
    screen !== 'drug-register' && isPlanBelowMinimum(session.plan, 'STARTER');
  const canMutateRx =
    (isOwner || hasPermission(session, 'prescriptions:verify')) && !queueLocked;

  const onSubmit = useCallback(
    async (command: RxCommand) => {
      if (command.screen !== 'drug-register' && queueLocked) {
        track('plan_lock_shown', { code: 'rx' });
        return {
          ok: false as const,
          code: 'PLAN_FEATURE_LOCKED',
          formError: rxLockCopy(),
        };
      }
      if (
        (command.action === 'approve' ||
          command.action === 'reject' ||
          command.action === 'dispense' ||
          command.action === 'dispenseToBilling') &&
        !canMutateRx
      ) {
        return {
          ok: false as const,
          code: 'FORBIDDEN',
          formError: rxErrorCopy('FORBIDDEN', undefined),
        };
      }
      if (command.action === 'loadRetention' && !isOwner) {
        return {
          ok: false as const,
          code: 'FORBIDDEN',
          formError: rxErrorCopy('FORBIDDEN', undefined),
        };
      }
      const result = await dispatchCommand(command);
      if (!result.ok && isPlanFeatureLocked(result.code)) {
        track('plan_lock_shown', { code: 'rx' });
      }
      if (result.ok) {
        const toast = TOAST_BY_ACTION[command.action];
        if (toast) {
          showToast(toast);
        }
        if (command.action === 'dispenseToBilling') {
          const cartId = result.cart_id ?? result.dispense?.cart_id;
          if (cartId) {
            navigate(`/pos?cart_id=${encodeURIComponent(cartId)}`);
          }
        }
      }
      return result;
    },
    [canMutateRx, isOwner, navigate, queueLocked, showToast],
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
      canMutateRx,
      canDispenseToBilling: false,
      canViewRetention: isOwner,
      rxId: options.rxId ?? null,
    }),
    [
      canMutateRx,
      isOwner,
      onSubmit,
      options.rxId,
      screen,
      session.plan,
      session.role,
    ],
  );
}
