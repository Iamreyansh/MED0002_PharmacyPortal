import { useCallback, useMemo } from 'react';
import type {
  FinanceCommand,
  FinanceFeatureData,
  FinanceScreen,
} from '@medmate/finance-contract';
import { useSession } from '@/modules/session';
import { financeErrorCopy } from '@/modules/finance/lib/errors';
import { submitSettlements } from '@/modules/finance/lib/submit-settlements';

export function useFinanceFeature(
  screen: FinanceScreen,
  options: { settlementId?: string | null } = {},
): FinanceFeatureData {
  const session = useSession();
  const canViewSettlements =
    session.role === 'pharmacy_owner' && session.tokenScope !== 'pos';

  const onSubmit = useCallback(
    async (command: FinanceCommand) => {
      if (!canViewSettlements) {
        const code =
          session.tokenScope === 'pos' ? 'POS_TOKEN_RESTRICTED' : 'FORBIDDEN';
        return {
          ok: false as const,
          code,
          formError: financeErrorCopy(code, undefined),
        };
      }
      return submitSettlements(command);
    },
    [canViewSettlements, session.tokenScope],
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
      canViewSettlements,
      settlementId: options.settlementId ?? null,
      tokenScope: session.tokenScope,
    }),
    [
      canViewSettlements,
      onSubmit,
      options.settlementId,
      screen,
      session.plan,
      session.role,
      session.tokenScope,
    ],
  );
}
