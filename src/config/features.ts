import type { EnvLike } from '@/config/env';

export type { EnvLike };

export function isDemoRemotesEnabled(
  env: EnvLike = import.meta.env as EnvLike,
): boolean {
  return env.VITE_ENABLE_DEMO_REMOTES === 'true';
}
