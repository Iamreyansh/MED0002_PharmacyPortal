import { useCallback, useMemo } from 'react';
import type {
  AnalyticsCommand,
  AnalyticsFeatureData,
} from '@medmate/analytics-contract';
import {
  analyticsLockCopy,
  isPlanFeatureLocked,
} from '@medmate/analytics-contract';
import { track } from '@/modules/api';
import { analyticsErrorCopy } from '@/modules/analytics/lib/errors';
import { submitAnalytics } from '@/modules/analytics/lib/submit-analytics';
import { isPlanBelowMinimum, useSession } from '@/modules/session';
import { useToast } from '@/modules/shell';

export function useAnalyticsFeature(): AnalyticsFeatureData {
  const session = useSession();
  const { showToast } = useToast();
  const isOwner = session.role === 'pharmacy_owner';
  const analyticsLocked = isPlanBelowMinimum(session.plan, 'RETAIL_PRO');
  const posRestricted = session.tokenScope === 'pos';
  const canViewGst = isOwner && !analyticsLocked && !posRestricted;
  const canFavorite = canViewGst;

  const onSubmit = useCallback(
    async (command: AnalyticsCommand) => {
      if (posRestricted) {
        return {
          ok: false as const,
          code: 'POS_TOKEN_RESTRICTED',
          formError: analyticsErrorCopy('POS_TOKEN_RESTRICTED', undefined),
        };
      }
      if (analyticsLocked) {
        track('plan_lock_shown', { code: 'analytics' });
        return {
          ok: false as const,
          code: 'PLAN_FEATURE_LOCKED',
          formError: analyticsLockCopy(),
        };
      }
      if (
        (command.action === 'loadGst' || command.action === 'favorite') &&
        !isOwner
      ) {
        return {
          ok: false as const,
          code: 'FORBIDDEN',
          formError: analyticsErrorCopy('FORBIDDEN', undefined),
        };
      }
      const result = await submitAnalytics(command);
      if (!result.ok && isPlanFeatureLocked(result.code)) {
        track('plan_lock_shown', { code: 'analytics' });
      }
      if (result.ok && command.action === 'favorite') {
        showToast('Favorite updated');
      }
      return result;
    },
    [analyticsLocked, isOwner, posRestricted, showToast],
  );

  return useMemo(
    () => ({
      screen: 'analytics',
      onSubmit,
      role:
        session.role === 'pharmacy_staff' || session.role === 'pharmacy_owner'
          ? session.role
          : null,
      plan: session.plan,
      analyticsLocked,
      canViewGst,
      canFavorite,
      tokenScope: session.tokenScope,
    }),
    [
      analyticsLocked,
      canFavorite,
      canViewGst,
      onSubmit,
      session.plan,
      session.role,
      session.tokenScope,
    ],
  );
}
