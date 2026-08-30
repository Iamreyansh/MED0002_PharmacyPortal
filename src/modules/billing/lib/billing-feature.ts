import { useCallback, useMemo } from 'react';
import type {
  BillingCommand,
  BillingFeatureData,
  BillingScreen,
  BillingSubmitResult,
} from '@medmate/billing-contract';
import { isPlanFeatureLocked } from '@medmate/billing-contract';
import { track } from '@/modules/api';
import { billingErrorCopy } from '@/modules/billing/lib/errors';
import { submitInvoiceSettings } from '@/modules/billing/lib/submit-invoice-settings';
import { submitInvoices } from '@/modules/billing/lib/submit-invoices';
import { submitSales } from '@/modules/billing/lib/submit-sales';
import { useSession } from '@/modules/session';
import { useToast } from '@/modules/shell';

const TOAST_BY_ACTION: Partial<Record<BillingCommand['action'], string>> = {
  share: 'Invoice shared',
  save: 'Invoice settings saved',
  markPaid: 'Sale marked paid',
  exportExcel: 'Export started',
  pdf: 'PDF downloaded',
};

function dispatchCommand(
  command: BillingCommand,
): Promise<BillingSubmitResult> {
  if (command.screen === 'invoice-settings') {
    return submitInvoiceSettings(command);
  }
  if (command.screen === 'sales') {
    return submitSales(command);
  }
  return submitInvoices(command);
}

export function useBillingFeature(
  screen: BillingScreen,
  options: { invoiceId?: string | null } = {},
): BillingFeatureData {
  const session = useSession();
  const { showToast } = useToast();
  const isOwner = session.role === 'pharmacy_owner';

  const onSubmit = useCallback(
    async (command: BillingCommand) => {
      if (command.action === 'save' && !isOwner) {
        return {
          ok: false as const,
          code: 'FORBIDDEN',
          formError: billingErrorCopy('FORBIDDEN', undefined),
        };
      }
      if (command.action === 'markPaid' && !isOwner) {
        return {
          ok: false as const,
          code: 'STAFF_CANNOT_MARK_PAID',
          formError: billingErrorCopy('STAFF_CANNOT_MARK_PAID', undefined),
        };
      }
      const result = await dispatchCommand(command);
      if (!result.ok && isPlanFeatureLocked(result.code)) {
        track('plan_lock_shown', { code: 'billing' });
      }
      if (result.ok) {
        const toast = TOAST_BY_ACTION[command.action];
        if (toast) {
          showToast(toast);
        }
      }
      return result;
    },
    [isOwner, showToast],
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
      canPatchSettings: isOwner,
      canMarkPaid: isOwner,
      invoiceId: options.invoiceId ?? null,
    }),
    [isOwner, onSubmit, options.invoiceId, screen, session.plan, session.role],
  );
}
