import {
  DEMO_REMOTE_REGISTRY,
  PRODUCT_REMOTE_REGISTRY,
  type ProductRemoteName,
  type RemoteRegistryMeta,
} from '../../config/remotes.registry';

export type EnvLike = Record<string, string | undefined>;

export function isDemoRemotesEnabled(
  env: EnvLike = import.meta.env as EnvLike,
): boolean {
  return env.VITE_ENABLE_DEMO_REMOTES === 'true';
}

export function getRemoteMeta(name: string): RemoteRegistryMeta | undefined {
  if (name === 'todo') {
    return DEMO_REMOTE_REGISTRY.todo;
  }
  if (name in PRODUCT_REMOTE_REGISTRY) {
    return PRODUCT_REMOTE_REGISTRY[name as ProductRemoteName];
  }
  return undefined;
}

export function listProductRemoteNames(): string[] {
  return Object.keys(PRODUCT_REMOTE_REGISTRY);
}

export type RemoteMount = {
  remoteName: string;
  module: string;
  route: string;
};

export function listProductMounts(): RemoteMount[] {
  return listProductRemoteNames().flatMap((name) => {
    const remote = PRODUCT_REMOTE_REGISTRY[name as ProductRemoteName];
    return remote.routes.map((route) => ({
      remoteName: remote.name,
      module: remote.module,
      route,
    }));
  });
}
