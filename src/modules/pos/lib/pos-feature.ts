import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  PosCommand,
  PosFeatureData,
  PosSubmitResult,
} from '@medmate/pos-contract';
import { createIdempotencyKey, track } from '@/modules/api';
import { useSession } from '@/modules/session';
import { submitPos } from '@/modules/pos/lib/submit-pos';

function rememberCartId(
  result: PosSubmitResult,
  setCartId: (id: string | null) => void,
): void {
  if (result.ok && result.cart?.cart_id) {
    setCartId(result.cart.cart_id);
  }
}

export function usePosFeature(
  options: { cartIdFromQuery?: string | null } = {},
): PosFeatureData {
  const session = useSession();
  const [cartId, setCartId] = useState<string | null>(null);
  const checkoutKey = useRef<string | null>(null);
  const loadedQuery = useRef<string | null>(null);
  const canSell =
    session.role === 'pharmacy_owner' || session.role === 'pharmacy_staff';

  const onSubmit = useCallback(
    async (command: PosCommand) => {
      if (command.action === 'checkout' && !checkoutKey.current) {
        checkoutKey.current = createIdempotencyKey();
      }
      const result = await submitPos(command, {
        cartId,
        checkoutKey: checkoutKey.current ?? createIdempotencyKey(),
      });
      rememberCartId(result, setCartId);
      if (command.action === 'checkout') {
        track('pos_checkout_result', {
          ok: result.ok,
          code: result.ok ? 'OK' : (result.code ?? 'UNKNOWN'),
        });
        if (result.ok) {
          checkoutKey.current = null;
          setCartId(null);
        }
      }
      return result;
    },
    [cartId],
  );

  useEffect(() => {
    const queryCartId = options.cartIdFromQuery;
    if (!queryCartId || loadedQuery.current === queryCartId) {
      return;
    }
    loadedQuery.current = queryCartId;
    void submitPos(
      {
        screen: 'counter',
        action: 'loadCart',
        values: { cart_id: queryCartId },
      },
      { cartId: queryCartId, checkoutKey: createIdempotencyKey() },
    ).then((result) => {
      rememberCartId(result, setCartId);
    });
  }, [options.cartIdFromQuery]);

  return useMemo(
    () => ({
      screen: 'counter',
      onSubmit,
      role:
        session.role === 'pharmacy_staff' || session.role === 'pharmacy_owner'
          ? session.role
          : null,
      plan: session.plan,
      tokenScope: session.tokenScope,
      cartId,
      canSell,
    }),
    [canSell, cartId, onSubmit, session.plan, session.role, session.tokenScope],
  );
}
