import { useCallback, useMemo } from 'react';
import type {
  OrdersCommand,
  OrdersFeatureData,
  OrdersScreen,
  OrdersSubmitResult,
} from '@medmate/orders-contract';
import { useSession } from '@/modules/session';
import { useToast } from '@/modules/shell';
import { ordersErrorCopy } from '@/modules/orders/lib/errors';
import { submitOrders } from '@/modules/orders/lib/submit-orders';
import { submitRxQuotes } from '@/modules/orders/lib/submit-rx-quotes';

const TOAST_BY_ACTION: Partial<Record<OrdersCommand['action'], string>> = {
  quote: 'Quote sent',
  decline: 'Quote declined',
  accept: 'Order accepted',
  reject: 'Order rejected',
  advanceStatus: 'Status updated',
  assignRider: 'Rider assigned',
};

function dispatchCommand(command: OrdersCommand): Promise<OrdersSubmitResult> {
  if (command.screen === 'rx-quotes') {
    return submitRxQuotes(command);
  }
  return submitOrders(command);
}

export function useOrdersFeature(
  screen: OrdersScreen,
  options: { orderId?: string | null } = {},
): OrdersFeatureData {
  const session = useSession();
  const { showToast } = useToast();
  const isPharmacyActor =
    session.role === 'pharmacy_owner' || session.role === 'pharmacy_staff';
  const canMutateOrders = isPharmacyActor && session.tokenScope !== 'pos';

  const onSubmit = useCallback(
    async (command: OrdersCommand) => {
      if (command.screen === 'orders-home' && command.action === 'noop') {
        return { ok: true as const };
      }
      if (
        (command.action === 'quote' ||
          command.action === 'decline' ||
          command.action === 'accept' ||
          command.action === 'reject' ||
          command.action === 'advanceStatus' ||
          command.action === 'assignRider') &&
        !canMutateOrders
      ) {
        return {
          ok: false as const,
          code:
            session.tokenScope === 'pos' ? 'POS_TOKEN_RESTRICTED' : 'FORBIDDEN',
          formError: ordersErrorCopy(
            session.tokenScope === 'pos' ? 'POS_TOKEN_RESTRICTED' : 'FORBIDDEN',
            undefined,
          ),
        };
      }
      const result = await dispatchCommand(command);
      if (result.ok) {
        const toast = TOAST_BY_ACTION[command.action];
        if (toast) {
          showToast(toast);
        }
      }
      return result;
    },
    [canMutateOrders, session.tokenScope, showToast],
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
      canMutateOrders,
      orderId: options.orderId ?? null,
      tokenScope: session.tokenScope,
    }),
    [
      canMutateOrders,
      onSubmit,
      options.orderId,
      screen,
      session.plan,
      session.role,
      session.tokenScope,
    ],
  );
}
