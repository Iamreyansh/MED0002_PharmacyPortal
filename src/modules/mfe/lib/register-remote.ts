import { getFederationHost } from '@medmate/host-kit';

export type RemoteRegistration = {
  name: string;
  entry: string;
  type?: string;
  alias?: string;
};

export type RegisterableHost = {
  registerRemotes?: (
    remotes: RemoteRegistration[],
    options?: { force?: boolean },
  ) => void;
};

const registered = new Set<string>();

export function resolveRemoteEntry(
  entry: string,
  origin = window.location.origin,
): string {
  return new URL(entry, origin).href;
}

export function ensureRemoteRegistered(
  name: string,
  entry: string | null | undefined,
  host: RegisterableHost | undefined = getFederationHost('host') as
    RegisterableHost | undefined,
): boolean {
  if (!entry || !host?.registerRemotes) {
    return false;
  }
  const absolute = resolveRemoteEntry(entry);
  const key = `${name}::${absolute}`;
  if (registered.has(key)) {
    return true;
  }
  host.registerRemotes([
    { name, alias: name, entry: absolute, type: 'module' },
  ]);
  registered.add(key);
  return true;
}

export function resetRegisteredRemotes(): void {
  registered.clear();
}
