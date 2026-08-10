/**
 * Host-owned remote registry — single source for route, nav, and module metadata.
 * Manifest URLs still come from VITE_REMOTE_<NAME>_URL env vars.
 * Page components are wired in `src/app/routes.tsx` to avoid circular imports.
 */
export type RemoteRegistryMeta = {
  name: string;
  module: string;
  route: string;
  navLabel: string;
};

export const REMOTE_REGISTRY = {
  todo: {
    name: 'todo',
    module: './Mfe',
    route: '/todos',
    navLabel: 'Todos',
  },
} as const satisfies Record<string, RemoteRegistryMeta>;

export type RemoteName = keyof typeof REMOTE_REGISTRY;

export function listRemoteRegistry(): RemoteRegistryMeta[] {
  return Object.values(REMOTE_REGISTRY);
}
