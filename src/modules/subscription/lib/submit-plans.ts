import type {
  CurrentSubscription,
  PlanCard,
  SubscriptionCommand,
  SubscriptionSubmitResult,
} from '@medmate/subscription-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/subscription/lib/errors';

const SUBSCRIPTION_PATH = '/api/v1/pharmacy/subscription';
const PLANS_PATH = `${SUBSCRIPTION_PATH}/plans`;

function asList<T>(data: unknown, keys: readonly string[]): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }
  return [];
}

function asSubscription(data: unknown): CurrentSubscription | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  return data as CurrentSubscription;
}

export async function submitPlans(
  command: SubscriptionCommand,
): Promise<SubscriptionSubmitResult> {
  if (command.screen !== 'plans') {
    return { ok: false, formError: 'This screen cannot update plans.' };
  }
  switch (command.action) {
    case 'load': {
      const [plansResult, subscriptionResult] = await Promise.all([
        hostApi.request<unknown>({ path: PLANS_PATH, method: 'GET' }),
        hostApi.request<unknown>({
          path: SUBSCRIPTION_PATH,
          method: 'GET',
        }),
      ]);
      if (!plansResult.ok && !subscriptionResult.ok) {
        return failureResult(
          subscriptionResult.code ?? plansResult.code,
          subscriptionResult.message ?? plansResult.message,
          subscriptionResult.details ?? plansResult.details,
        );
      }
      return {
        ok: true,
        plans: plansResult.ok
          ? asList<PlanCard>(plansResult.data, ['plans', 'items'])
          : [],
        subscription: subscriptionResult.ok
          ? asSubscription(subscriptionResult.data)
          : null,
        plansForbidden: !plansResult.ok,
      };
    }
    case 'subscribe':
    case 'upgrade':
    case 'downgrade':
    case 'cancel': {
      const path =
        command.action === 'cancel'
          ? `${SUBSCRIPTION_PATH}/cancel`
          : `${SUBSCRIPTION_PATH}/${command.action}`;
      const body =
        command.action === 'cancel'
          ? undefined
          : { plan_id: command.values.plan_id };
      const idempotencyKey =
        command.action === 'subscribe' || command.action === 'upgrade'
          ? (command.values.idempotencyKey ?? createIdempotencyKey())
          : undefined;
      const result = await hostApi.request<CurrentSubscription>({
        path,
        method: 'POST',
        body,
        idempotencyKey,
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, subscription: asSubscription(result.data) };
    }
    case 'autoRenew': {
      const result = await hostApi.request<CurrentSubscription>({
        path: `${SUBSCRIPTION_PATH}/auto-renew`,
        method: 'PATCH',
        body: { enabled: command.values.enabled },
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, subscription: asSubscription(result.data) };
    }
    default:
      return { ok: false, formError: 'This screen cannot update plans.' };
  }
}
