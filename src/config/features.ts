import type { EnvLike } from '@/config/env';

export type { EnvLike };

export function isDemoRemotesEnabled(
  env: EnvLike = import.meta.env as EnvLike,
): boolean {
  return env.VITE_ENABLE_DEMO_REMOTES === 'true';
}

/** Public flag only. Cashfree secrets stay on Core. Unset = fail-closed. */
export function isSaasPaymentsEnabled(
  env: EnvLike = import.meta.env as EnvLike,
): boolean {
  return env.VITE_SAAS_PAYMENTS_ENABLED === 'true';
}
