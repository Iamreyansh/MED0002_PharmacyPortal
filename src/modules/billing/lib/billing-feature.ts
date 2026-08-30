import { useCallback, useMemo } from 'react';
import type {
  BillingCommand,
  BillingFeatureData,
  BillingScreen,
  BillingSubmitResult,
} from '@medmate/billing-contract';
import {
  isPlanFeatureLocked,
  khataLockCopy,
  offersLockCopy,
} from '@medmate/billing-contract';
import { track } from '@/modules/api';
import { billingErrorCopy } from '@/modules/billing/lib/errors';
import { submitInvoiceSettings } from '@/modules/billing/lib/submit-invoice-settings';
import { submitInvoices } from '@/modules/billing/lib/submit-invoices';
import { submitKhata } from '@/modules/billing/lib/submit-khata';
import { submitOffers } from '@/modules/billing/lib/submit-offers';
import { submitSales } from '@/modules/billing/lib/submit-sales';
import { isPlanBelowMinimum, useSession } from '@/modules/session';
import { useToast } from '@/modules/shell';

const TOAST_BY_ACTION: Partial<Record<BillingCommand['action'], string>> = {
  share: 'Invoice shared',
  save: 'Invoice settings saved',
  markPaid: 'Sale marked paid',
  exportExcel: 'Export started',
  pdf: 'PDF downloaded',
  repay: 'Repayment recorded',
  remind: 'Reminder sent',
  create: 'Offer created',
  delete: 'Offer removed',
};

function lockTelemetryCode(
  command: BillingCommand,
): 'khata' | 'offers' | 'billing' {
  if (command.screen === 'khata' || command.screen === 'khata-detail') {
    return 'khata';
  }
  if (command.screen === 'offers') {
    return 'offers';
  }
  return 'billing';
}

function dispatchCommand(
  command: BillingCommand,
): Promise<BillingSubmitResult> {
  if (command.screen === 'invoice-settings') {
    return submitInvoiceSettings(command);
  }
  if (command.screen === 'sales') {
    return submitSales(command);
  }
  if (command.screen === 'khata' || command.screen === 'khata-detail') {
    return submitKhata(command);
  }
  if (command.screen === 'offers') {
    return submitOffers(command);
  }
  return submitInvoices(command);
}

export function useBillingFeature(
  screen: BillingScreen,
  options: { invoiceId?: string | null; customerId?: string | null } = {},
): BillingFeatureData {
  const session = useSession();
  const { showToast } = useToast();
  const isOwner = session.role === 'pharmacy_owner';
  const khataLocked = isPlanBelowMinimum(session.plan, 'STARTER');
  const offersLocked = isPlanBelowMinimum(session.plan, 'RETAIL_PRO');

  const onSubmit = useCallback(
    async (command: BillingCommand) => {
      const lockCode = lockTelemetryCode(command);
      if (
        (command.screen === 'khata' || command.screen === 'khata-detail') &&
        khataLocked
      ) {
        track('plan_lock_shown', { code: 'khata' });
        return {
          ok: false as const,
          code: 'PLAN_FEATURE_LOCKED',
          formError: khataLockCopy(),
        };
      }
      if (command.screen === 'offers' && offersLocked) {
        track('plan_lock_shown', { code: 'offers' });
        return {
          ok: false as const,
          code: 'PLAN_FEATURE_LOCKED',
          formError: offersLockCopy(),
        };
      }
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
      if (command.action === 'remind' && !isOwner) {
        return {
          ok: false as const,
          code: 'STAFF_CANNOT_REMIND',
          formError: billingErrorCopy('STAFF_CANNOT_REMIND', undefined),
        };
      }
      if (
        (command.action === 'create' ||
          command.action === 'patch' ||
          command.action === 'toggle' ||
          command.action === 'delete') &&
        !isOwner
      ) {
        return {
          ok: false as const,
          code: 'FORBIDDEN',
          formError: billingErrorCopy('FORBIDDEN', undefined),
        };
      }
      const result = await dispatchCommand(command);
      if (!result.ok && isPlanFeatureLocked(result.code)) {
        track('plan_lock_shown', { code: lockCode });
      }
      if (result.ok) {
        const toast = TOAST_BY_ACTION[command.action];
        if (toast) {
          showToast(toast);
        }
      }
      return result;
    },
    [isOwner, khataLocked, offersLocked, showToast],
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
      canRemind: isOwner && !khataLocked,
      canMutateOffers: isOwner && !offersLocked,
      invoiceId: options.invoiceId ?? null,
      customerId: options.customerId ?? null,
    }),
    [
      isOwner,
      khataLocked,
      offersLocked,
      onSubmit,
      options.customerId,
      options.invoiceId,
      screen,
      session.plan,
      session.role,
    ],
  );
}
