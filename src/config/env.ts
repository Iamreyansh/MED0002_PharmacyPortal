export type EnvLike = Record<string, string | undefined>;

export function readEnv(env: EnvLike = import.meta.env as EnvLike): EnvLike {
  return env;
}

export function readPublicEnv(
  key: string,
  env: EnvLike = import.meta.env as EnvLike,
): string | undefined {
  const value = env[key];
  return value && value.length > 0 ? value : undefined;
}

export function readApiBaseUrl(
  env: EnvLike = import.meta.env as EnvLike,
): string {
  return String(env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
}
