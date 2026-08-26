import { getTokens } from '@/api/token-store';
import {
  mapPharmacyRole,
  mapPlanCode,
  mapPharmacyStatus,
  UNAUTHENTICATED_SESSION,
  type PharmacyOption,
  type PortalSession,
  type TokenScope,
} from '@/session/session';
import { getSessionSnapshot } from '@/session/snapshot';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function parsePharmacies(value: unknown): PharmacyOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const rows: PharmacyOption[] = [];
  for (const item of value) {
    const row = asRecord(item);
    if (!row) {
      continue;
    }
    const id = asString(row.id);
    const name = asString(row.name);
    if (!id || !name) {
      continue;
    }
    rows.push({
      id,
      name,
      role: asString(row.role) ?? '',
      isActive: row.is_active !== false,
    });
  }
  return rows;
}

function parsePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

export function sessionFromLogin(
  data: Record<string, unknown>,
  tokenScope: TokenScope,
): { session: PortalSession; pharmacies: PharmacyOption[] } {
  const staff = asRecord(data.staff);
  const active = asRecord(data.active_pharmacy);
  const pharmacies = parsePharmacies(data.pharmacies);
  const pharmacyId = asString(active?.id);
  const pharmacyName = asString(active?.name) ?? 'Your pharmacy';
  return {
    pharmacies,
    session: {
      authenticated: true,
      role: mapPharmacyRole(staff?.role),
      plan: mapPlanCode(active?.subscription_plan),
      pharmacyStatus: null,
      tokenScope,
      permissions: staff?.role === 'pharmacy_owner' || staff?.role === 'owner'
        ? ['*']
        : [],
      pharmacyName,
      staffName: asString(staff?.name) ?? '',
      staffId: asString(staff?.id),
      pharmacyId,
    },
  };
}

export function sessionFromMe(
  data: Record<string, unknown>,
  previous: PortalSession,
  pharmacies: readonly PharmacyOption[],
): { session: PortalSession; pharmacies: PharmacyOption[] } {
  const active = asRecord(data.active_pharmacy);
  const pharmacyId = asString(active?.id) ?? previous.pharmacyId;
  const pharmacyName =
    asString(active?.name) ?? previous.pharmacyName ?? 'Your pharmacy';
  const permissions = parsePermissions(data.permissions);
  return {
    pharmacies: [...pharmacies],
    session: {
      authenticated: true,
      role: mapPharmacyRole(data.role ?? previous.role),
      plan: previous.plan,
      pharmacyStatus: previous.pharmacyStatus,
      tokenScope: getTokens().tokenScope,
      permissions:
        permissions.length > 0
          ? permissions
          : mapPharmacyRole(data.role ?? previous.role) === 'pharmacy_owner'
            ? ['*']
            : previous.permissions,
      pharmacyName,
      staffName: asString(data.name) ?? previous.staffName,
      staffId: asString(data.id) ?? previous.staffId,
      pharmacyId,
    },
  };
}

export function sessionFromSwitch(
  data: Record<string, unknown>,
  previous: PortalSession,
  pharmacies: readonly PharmacyOption[],
): { session: PortalSession; pharmacies: PharmacyOption[] } {
  const active = asRecord(data.active_pharmacy);
  return {
    pharmacies: [...pharmacies],
    session: {
      ...previous,
      authenticated: true,
      role: mapPharmacyRole(data.role_in_pharmacy ?? previous.role),
      plan: mapPlanCode(active?.subscription_plan) ?? previous.plan,
      tokenScope: getTokens().tokenScope,
      pharmacyName: asString(active?.name) ?? previous.pharmacyName,
      pharmacyId: asString(active?.id) ?? previous.pharmacyId,
    },
  };
}

export function sessionFromPosPin(
  data: Record<string, unknown>,
): { session: PortalSession; pharmacies: PharmacyOption[] } {
  const staff = asRecord(data.staff);
  const pharmacy = asRecord(data.pharmacy);
  return {
    pharmacies: [],
    session: {
      authenticated: true,
      role: mapPharmacyRole(staff?.role),
      plan: null,
      pharmacyStatus: 'ACTIVE',
      tokenScope: 'pos',
      permissions: ['pos:sell'],
      pharmacyName: asString(pharmacy?.name) ?? 'Your pharmacy',
      staffName: asString(staff?.name) ?? '',
      staffId: asString(staff?.id),
      pharmacyId: asString(pharmacy?.id),
    },
  };
}

export function applyRegistrationStatus(
  data: Record<string, unknown>,
  previous: PortalSession,
): PortalSession {
  return {
    ...previous,
    pharmacyStatus: mapPharmacyStatus(data.status) ?? previous.pharmacyStatus,
    plan: mapPlanCode(data.plan) ?? previous.plan,
    pharmacyName:
      asString(data.business_name) ?? previous.pharmacyName,
    pharmacyId: asString(data.pharmacy_id) ?? previous.pharmacyId,
  };
}

export function hydrateInitialSession(): {
  session: PortalSession;
  pharmacies: PharmacyOption[];
} {
  const tokens = getTokens();
  const hasTokens = Boolean(tokens.accessToken || tokens.refreshToken);
  if (!hasTokens) {
    return { session: UNAUTHENTICATED_SESSION, pharmacies: [] };
  }
  const snap = getSessionSnapshot();
  if (!snap) {
    return {
      pharmacies: [],
      session: {
        ...UNAUTHENTICATED_SESSION,
        authenticated: true,
        tokenScope: tokens.tokenScope,
      },
    };
  }
  return {
    pharmacies: snap.pharmacies,
    session: {
      authenticated: true,
      role: snap.role,
      plan: snap.plan,
      pharmacyStatus: snap.pharmacyStatus,
      tokenScope: tokens.tokenScope,
      permissions: snap.permissions,
      pharmacyName: snap.pharmacyName,
      staffName: snap.staffName,
      staffId: snap.staffId,
      pharmacyId: snap.pharmacyId,
    },
  };
}
