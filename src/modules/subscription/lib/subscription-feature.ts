import { useCallback, useMemo } from 'react';
import type {
  SubscriptionCommand,
  SubscriptionFeatureData,
  SubscriptionScreen,
} from '@medmate/subscription-contract';
import { isSaasPaymentsEnabled } from '@/config/features';
import { useSession } from '@/modules/session';
import { useToast } from '@/modules/shell';
import { submitBilling } from '@/modules/subscription/lib/submit-billing';
import { submitPlans } from '@/modules/subscription/lib/submit-plans';

const TOAST_BY_ACTION: Partial<Record<SubscriptionCommand['action'], string>> =
  {
    subscribe: 'Subscription updated',
    upgrade: 'Plan upgraded',
    downgrade: 'Downgrade scheduled',
    cancel: 'Cancellation requested',
    autoRenew: 'Auto-renew updated',
  };

export function useSubscriptionFeature(
  screen: SubscriptionScreen,
): SubscriptionFeatureData {
  const session = useSession();
  const { showToast } = useToast();

  const onSubmit = useCallback(
    async (command: SubscriptionCommand) => {
      const result =
        command.screen === 'billing'
          ? await submitBilling(command)
          : await submitPlans(command);
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
      disabled: !isSaasPaymentsEnabled(),
    }),
    [onSubmit, screen, session.role],
  );
}
