import type { PlanCode } from '@/modules/session/store/session';

export type NavGroupId =
  'counter' | 'stock' | 'fulfilment' | 'money' | 'engagement' | 'settings';

export type NavItem = {
  id: string;
  path: string;
  label: string;
  group: NavGroupId;
  permission?: string;
  minPlan?: PlanCode;
  ownerOnly?: boolean;
  requirePharmacyActive?: boolean;
  showWhenNotActive?: boolean;
  posAllowed?: boolean;
  homeShortcut?: boolean;
};

export const NAV_GROUP_ORDER: readonly NavGroupId[] = [
  'counter',
  'stock',
  'fulfilment',
  'money',
  'engagement',
  'settings',
];

export const NAV_GROUP_LABEL: Record<NavGroupId, string> = {
  counter: 'Counter',
  stock: 'Stock',
  fulfilment: 'Fulfilment',
  money: 'Money',
  engagement: 'Engagement',
  settings: 'Settings',
};

export const NAV_CATALOG: readonly NavItem[] = [
  {
    id: 'pos',
    path: '/pos',
    label: 'POS',
    group: 'counter',
    posAllowed: true,
    homeShortcut: true,
  },
  {
    id: 'catalogue',
    path: '/catalogue',
    label: 'Catalogue',
    group: 'stock',
    homeShortcut: true,
  },
  {
    id: 'inventory',
    path: '/inventory',
    label: 'Inventory',
    group: 'stock',
    homeShortcut: true,
  },
  {
    id: 'purchases',
    path: '/purchases',
    label: 'Purchases',
    group: 'stock',
    homeShortcut: true,
  },
  {
    id: 'racks',
    path: '/racks',
    label: 'Racks',
    group: 'stock',
    homeShortcut: true,
  },
  {
    id: 'distributors',
    path: '/distributors',
    label: 'Distributors',
    group: 'stock',
    minPlan: 'RETAIL_PRO',
  },
  {
    id: 'reorder',
    path: '/reorder',
    label: 'Reorder',
    group: 'stock',
    minPlan: 'RETAIL_PRO',
  },
  {
    id: 'prescriptions',
    path: '/prescriptions',
    label: 'Prescriptions',
    group: 'fulfilment',
    minPlan: 'STARTER',
    homeShortcut: true,
  },
  {
    id: 'rx-quotes',
    path: '/rx-quotes',
    label: 'Rx quotes',
    group: 'fulfilment',
    requirePharmacyActive: true,
    homeShortcut: true,
  },
  {
    id: 'orders',
    path: '/orders',
    label: 'Orders',
    group: 'fulfilment',
    requirePharmacyActive: true,
  },
  {
    id: 'drug-register',
    path: '/compliance/drug-register',
    label: 'Drug register',
    group: 'fulfilment',
    homeShortcut: true,
  },
  {
    id: 'invoices',
    path: '/invoices',
    label: 'Invoices',
    group: 'money',
    homeShortcut: true,
  },
  {
    id: 'sales',
    path: '/sales',
    label: 'Sales',
    group: 'money',
    homeShortcut: true,
  },
  {
    id: 'khata',
    path: '/khata',
    label: 'Khata',
    group: 'money',
    minPlan: 'STARTER',
    homeShortcut: true,
  },
  {
    id: 'offers',
    path: '/offers',
    label: 'Offers',
    group: 'money',
    minPlan: 'RETAIL_PRO',
  },
  {
    id: 'settlements',
    path: '/finance/settlements',
    label: 'Settlements',
    group: 'money',
    ownerOnly: true,
  },
  {
    id: 'subscription',
    path: '/subscription',
    label: 'Subscription',
    group: 'money',
    homeShortcut: true,
  },
  {
    id: 'analytics',
    path: '/analytics',
    label: 'Analytics',
    group: 'engagement',
    minPlan: 'RETAIL_PRO',
    homeShortcut: true,
  },
  {
    id: 'support',
    path: '/support/new',
    label: 'Support',
    group: 'engagement',
    homeShortcut: true,
  },
  {
    id: 'help',
    path: '/help',
    label: 'Help',
    group: 'engagement',
    homeShortcut: true,
  },
  {
    id: 'profile',
    path: '/settings/profile',
    label: 'Profile',
    group: 'settings',
    homeShortcut: true,
  },
  {
    id: 'storefront',
    path: '/settings/storefront',
    label: 'Storefront',
    group: 'settings',
  },
  {
    id: 'roles',
    path: '/settings/roles',
    label: 'Roles',
    group: 'settings',
    permission: 'staff:manage',
  },
  {
    id: 'notifications',
    path: '/settings/notifications',
    label: 'Notifications',
    group: 'settings',
  },
  {
    id: 'sessions',
    path: '/sessions',
    label: 'Sessions',
    group: 'settings',
  },
  {
    id: 'kyc',
    path: '/onboarding/kyc',
    label: 'KYC',
    group: 'settings',
    showWhenNotActive: true,
  },
];

export function productNavIncludesTodo(
  items: readonly NavItem[] = NAV_CATALOG,
): boolean {
  return items.some(
    (item) =>
      item.id === 'todo' || item.path === '/todos' || item.label === 'Todos',
  );
}
