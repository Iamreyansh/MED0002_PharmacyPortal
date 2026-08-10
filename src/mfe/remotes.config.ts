export type EnvRecord = Record<string, string | undefined>;

export type FederationRemote = {
  type: 'module';
  name: string;
  entry: string;
  entryGlobalName: string;
  shareScope: string;
};

const REMOTE_ENV_PATTERN = /^VITE_REMOTE_([A-Z0-9_]+)_URL$/;

export function buildFederationRemotes(
  env: EnvRecord,
): Record<string, FederationRemote> {
  const remotes: Record<string, FederationRemote> = {};

  for (const [key, value] of Object.entries(env)) {
    if (!value) continue;
    const match = REMOTE_ENV_PATTERN.exec(key);
    if (!match?.[1]) continue;
    const name = match[1].toLowerCase();
    remotes[name] = {
      type: 'module',
      name,
      entry: value,
      entryGlobalName: name,
      shareScope: 'default',
    };
  }

  return remotes;
}

export function getRemoteUrl(name: string): string | undefined {
  const envKey = `VITE_REMOTE_${name.toUpperCase()}_URL`;
  const env = import.meta.env as EnvRecord;
  const value = env[envKey];
  return value && value.length > 0 ? value : undefined;
}

export function listConfiguredRemotes(): string[] {
  return Object.keys(buildFederationRemotes(import.meta.env as EnvRecord));
}

export const REMOTE_REGISTRY = {
  todo: {
    name: 'todo',
    module: './Mfe',
    route: '/todos',
  },
} as const;
