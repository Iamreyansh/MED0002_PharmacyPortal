/**
 * Host-owned remote registry — single source for route, nav, and module metadata.
 * Manifest URLs come from runtime `mfeDomainSuffix`, VITE_MFE_DOMAIN_SUFFIX
 * (`https://<name>.<suffix>/mf-manifest.json`) or an explicit VITE_REMOTE_<NAME>_URL.
 * Product iteration must use PRODUCT_REMOTE_REGISTRY (Todo is demo-only).
 */
import { getRemoteUrl } from '@medmate/federation-config';
import { readRemoteLookupEnv, type EnvLike } from '@/config/env';
export type RemoteRegistryMeta = {
  name: string;
  module: string;
  route: string;
  routes: readonly string[];
  navLabel: string;
};

export const PRODUCT_REMOTE_REGISTRY = {
  auth: {
    name: 'auth',
    module: './Mfe',
    route: '/login',
    routes: ['/login', '/pos-login', '/sessions'],
    navLabel: 'Auth',
  },
  onboarding: {
    name: 'onboarding',
    module: './Mfe',
    route: '/onboarding',
    routes: [
      '/onboarding',
      '/onboarding/status',
      '/onboarding/kyc',
      '/register',
      '/register/verify',
    ],
    navLabel: 'Onboarding',
  },
  pos: {
    name: 'pos',
    module: './Mfe',
    route: '/pos',
    routes: ['/pos'],
    navLabel: 'POS',
  },
  catalogue: {
    name: 'catalogue',
    module: './Mfe',
    route: '/catalogue',
    routes: ['/catalogue'],
    navLabel: 'Catalogue',
  },
  inventory: {
    name: 'inventory',
    module: './Mfe',
    route: '/inventory',
    routes: ['/inventory', '/racks'],
    navLabel: 'Inventory',
  },
  procurement: {
    name: 'procurement',
    module: './Mfe',
    route: '/purchases',
    routes: ['/purchases', '/distributors', '/reorder'],
    navLabel: 'Purchases',
  },
  billing: {
    name: 'billing',
    module: './Mfe',
    route: '/invoices',
    routes: ['/invoices', '/sales', '/khata', '/offers', '/invoice-settings'],
    navLabel: 'Billing',
  },
  rx: {
    name: 'rx',
    module: './Mfe',
    route: '/prescriptions',
    routes: ['/prescriptions', '/compliance/drug-register'],
    navLabel: 'Prescriptions',
  },
  orders: {
    name: 'orders',
    module: './Mfe',
    route: '/rx-quotes',
    routes: ['/rx-quotes', '/orders'],
    navLabel: 'Orders',
  },
  finance: {
    name: 'finance',
    module: './Mfe',
    route: '/finance',
    routes: ['/finance'],
    navLabel: 'Finance',
  },
  analytics: {
    name: 'analytics',
    module: './Mfe',
    route: '/analytics',
    routes: ['/analytics'],
    navLabel: 'Analytics',
  },
  settings: {
    name: 'settings',
    module: './Mfe',
    route: '/settings',
    routes: [
      '/settings',
      '/settings/profile',
      '/settings/storefront',
      '/settings/roles',
    ],
    navLabel: 'Settings',
  },
  subscription: {
    name: 'subscription',
    module: './Mfe',
    route: '/subscription',
    routes: ['/subscription', '/billing'],
    navLabel: 'Subscription',
  },
  support: {
    name: 'support',
    module: './Mfe',
    route: '/help',
    routes: ['/help', '/support'],
    navLabel: 'Support',
  },
} as const satisfies Record<string, RemoteRegistryMeta>;

export const DEMO_REMOTE_REGISTRY = {
  todo: {
    name: 'todo',
    module: './Mfe',
    route: '/todos',
    routes: ['/todos'],
    navLabel: 'Todos',
  },
} as const satisfies Record<string, RemoteRegistryMeta>;

/** Combined lookup including demo remotes. Do not iterate this for product nav. */
export const REMOTE_REGISTRY = {
  ...PRODUCT_REMOTE_REGISTRY,
  ...DEMO_REMOTE_REGISTRY,
} as const;

export type RemoteName = keyof typeof REMOTE_REGISTRY;
export type ProductRemoteName = keyof typeof PRODUCT_REMOTE_REGISTRY;

export function listProductRegistry(): RemoteRegistryMeta[] {
  return Object.values(PRODUCT_REMOTE_REGISTRY);
}

export function listRemoteRegistry(): RemoteRegistryMeta[] {
  return listProductRegistry();
}

export function resolveRemoteUrl(
  name: string,
  env: EnvLike = import.meta.env as EnvLike,
): string | undefined {
  return getRemoteUrl(name, readRemoteLookupEnv(env));
}
