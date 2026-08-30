import { useCallback, useMemo } from 'react';
import type {
  SupportCommand,
  SupportFeatureData,
  SupportScreen,
} from '@medmate/support-contract';
import { useSession } from '@/modules/session';
import { supportErrorCopy } from '@/modules/support/lib/errors';
import { submitHelp } from '@/modules/support/lib/submit-help';
import { submitTickets } from '@/modules/support/lib/submit-tickets';

function isHelpScreen(screen: SupportScreen): boolean {
  return screen === 'help' || screen === 'help-article';
}

export function useSupportFeature(
  screen: SupportScreen,
  options: { ticketId?: string | null; articleId?: string | null } = {},
): SupportFeatureData {
  const session = useSession();
  const canUseTickets =
    (session.role === 'pharmacy_owner' || session.role === 'pharmacy_staff') &&
    session.tokenScope !== 'pos' &&
    session.authenticated;

  const onSubmit = useCallback(
    async (command: SupportCommand) => {
      if (isHelpScreen(command.screen)) {
        return submitHelp(command);
      }
      if (!canUseTickets) {
        const code =
          session.tokenScope === 'pos' ? 'POS_TOKEN_RESTRICTED' : 'FORBIDDEN';
        return {
          ok: false as const,
          code,
          formError: supportErrorCopy(code, undefined),
        };
      }
      return submitTickets(command);
    },
    [canUseTickets, session.tokenScope],
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
      canUseTickets,
      authenticated: session.authenticated,
      ticketId: options.ticketId ?? null,
      articleId: options.articleId ?? null,
      tokenScope: session.tokenScope,
      userId: session.staffId ?? null,
    }),
    [
      canUseTickets,
      onSubmit,
      options.articleId,
      options.ticketId,
      screen,
      session.authenticated,
      session.plan,
      session.role,
      session.staffId,
      session.tokenScope,
    ],
  );
}
