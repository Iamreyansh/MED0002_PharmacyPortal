export type PlanCode = 'FREE' | 'STARTER' | 'RETAIL_PRO' | 'ENTERPRISE';
export type PharmacyRole = 'pharmacy_owner' | 'pharmacy_staff';
export type PharmacyStatus =
  'PENDING_KYC' | 'KYC_SUBMITTED' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
export type TokenScope = 'full' | 'pos';

export type PharmacyOption = {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
};

export type PortalSession = {
  authenticated: boolean;
  role: PharmacyRole | null;
  plan: PlanCode | null;
  pharmacyStatus: PharmacyStatus | null;
  tokenScope: TokenScope;
  permissions: readonly string[];
  pharmacyName: string;
  staffName: string;
  staffId: string | null;
  pharmacyId: string | null;
};

export const PLAN_RANK: Record<PlanCode, number> = {
  FREE: 0,
  STARTER: 1,
  RETAIL_PRO: 2,
  ENTERPRISE: 3,
};

const PHARMACY_STATUSES: readonly PharmacyStatus[] = [
  'PENDING_KYC',
  'KYC_SUBMITTED',
  'ACTIVE',
  'REJECTED',
  'SUSPENDED',
];

export const UNAUTHENTICATED_SESSION: PortalSession = {
  authenticated: false,
  role: null,
  plan: null,
  pharmacyStatus: null,
  tokenScope: 'full',
  permissions: [],
  pharmacyName: 'Your pharmacy',
  staffName: '',
  staffId: null,
  pharmacyId: null,
};

function fixture(
  session: Omit<PortalSession, 'staffId' | 'pharmacyId'> & {
    staffName: string;
  },
): PortalSession {
  return {
    ...session,
    staffId: 'fixture-staff',
    pharmacyId: 'fixture-pharmacy',
  };
}

export function planDisplayLabel(plan: PlanCode): string {
  switch (plan) {
    case 'FREE':
      return 'Free';
    case 'STARTER':
      return 'Starter';
    case 'RETAIL_PRO':
      return 'Growth';
    case 'ENTERPRISE':
      return 'Pro';
  }
}

export function isPlanBelowMinimum(
  current: PlanCode | null,
  minimum: PlanCode,
): boolean {
  if (!current) {
    return true;
  }
  return PLAN_RANK[current] < PLAN_RANK[minimum];
}

export function formatPlanLockCopy(
  itemLabel: string,
  minimum: PlanCode,
  session: PortalSession,
): string {
  const need = planDisplayLabel(minimum);
  if (session.role === 'pharmacy_staff') {
    return `${itemLabel} needs ${need}. Ask the pharmacy owner to upgrade.`;
  }
  const current = planDisplayLabel(session.plan ?? 'FREE');
  return `${itemLabel} needs ${need}. Your plan is ${current}.`;
}

export function hasPermission(
  session: PortalSession,
  permission?: string,
): boolean {
  if (!permission) {
    return true;
  }
  if (session.role === 'pharmacy_owner') {
    return true;
  }
  if (session.permissions.includes('*')) {
    return true;
  }
  return session.permissions.includes(permission);
}

export function mapPharmacyRole(role: unknown): PharmacyRole {
  if (role === 'pharmacy_owner' || role === 'owner') {
    return 'pharmacy_owner';
  }
  return 'pharmacy_staff';
}

export function mapPlanCode(plan: unknown): PlanCode | null {
  if (
    plan === 'FREE' ||
    plan === 'STARTER' ||
    plan === 'RETAIL_PRO' ||
    plan === 'ENTERPRISE'
  ) {
    return plan;
  }
  if (plan === 'GROWTH') {
    return 'RETAIL_PRO';
  }
  if (plan === 'PRO') {
    return 'ENTERPRISE';
  }
  return null;
}

export function mapPharmacyStatus(status: unknown): PharmacyStatus | null {
  if (typeof status !== 'string') {
    return null;
  }
  return PHARMACY_STATUSES.includes(status as PharmacyStatus)
    ? (status as PharmacyStatus)
    : null;
}

export const SESSION_FIXTURES = {
  unauthenticated: UNAUTHENTICATED_SESSION,
  'owner-free': fixture({
    authenticated: true,
    role: 'pharmacy_owner',
    plan: 'FREE',
    pharmacyStatus: 'ACTIVE',
    tokenScope: 'full',
    permissions: ['*'],
    pharmacyName: 'Your pharmacy',
    staffName: 'Owner',
  }),
  'owner-retail-pro': fixture({
    authenticated: true,
    role: 'pharmacy_owner',
    plan: 'RETAIL_PRO',
    pharmacyStatus: 'ACTIVE',
    tokenScope: 'full',
    permissions: ['*'],
    pharmacyName: 'Your pharmacy',
    staffName: 'Owner',
  }),
  'owner-enterprise': fixture({
    authenticated: true,
    role: 'pharmacy_owner',
    plan: 'ENTERPRISE',
    pharmacyStatus: 'ACTIVE',
    tokenScope: 'full',
    permissions: ['*'],
    pharmacyName: 'Your pharmacy',
    staffName: 'Owner',
  }),
  cashier: fixture({
    authenticated: true,
    role: 'pharmacy_staff',
    plan: 'FREE',
    pharmacyStatus: 'ACTIVE',
    tokenScope: 'full',
    permissions: ['pos:sell'],
    pharmacyName: 'Your pharmacy',
    staffName: 'Cashier',
  }),
  'staff-star': fixture({
    authenticated: true,
    role: 'pharmacy_staff',
    plan: 'FREE',
    pharmacyStatus: 'ACTIVE',
    tokenScope: 'full',
    permissions: ['*'],
    pharmacyName: 'Your pharmacy',
    staffName: 'Staff',
  }),
  'staff-active': fixture({
    authenticated: true,
    role: 'pharmacy_staff',
    plan: 'STARTER',
    pharmacyStatus: 'ACTIVE',
    tokenScope: 'full',
    permissions: ['staff:manage'],
    pharmacyName: 'Your pharmacy',
    staffName: 'Staff',
  }),
  'owner-pending-kyc': fixture({
    authenticated: true,
    role: 'pharmacy_owner',
    plan: 'FREE',
    pharmacyStatus: 'PENDING_KYC',
    tokenScope: 'full',
    permissions: ['*'],
    pharmacyName: 'Your pharmacy',
    staffName: 'Owner',
  }),
  'pos-scope': fixture({
    authenticated: true,
    role: 'pharmacy_staff',
    plan: 'FREE',
    pharmacyStatus: 'ACTIVE',
    tokenScope: 'pos',
    permissions: ['pos:sell'],
    pharmacyName: 'Your pharmacy',
    staffName: 'Cashier',
  }),
  'owner-suspended': fixture({
    authenticated: true,
    role: 'pharmacy_owner',
    plan: 'FREE',
    pharmacyStatus: 'SUSPENDED',
    tokenScope: 'full',
    permissions: ['*'],
    pharmacyName: 'Your pharmacy',
    staffName: 'Owner',
  }),
} as const satisfies Record<string, PortalSession>;

export type SessionFixtureName = keyof typeof SESSION_FIXTURES;

export function isSessionFixtureName(
  value: string,
): value is SessionFixtureName {
  return value in SESSION_FIXTURES;
}

export function readSessionFixture(
  name: string | undefined = import.meta.env.VITE_SESSION_FIXTURE,
): PortalSession {
  if (name && isSessionFixtureName(name)) {
    return SESSION_FIXTURES[name];
  }
  return UNAUTHENTICATED_SESSION;
}
