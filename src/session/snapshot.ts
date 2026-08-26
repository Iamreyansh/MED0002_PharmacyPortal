import type {
  PharmacyOption,
  PharmacyRole,
  PlanCode,
  PharmacyStatus,
  TokenScope,
} from '@/session/session';

export const PORTAL_SESSION_SNAPSHOT_KEY = 'medmate.portal.session';

export type SessionSnapshot = {
  pharmacies: PharmacyOption[];
  staffId: string | null;
  staffName: string;
  pharmacyId: string | null;
  pharmacyName: string;
  role: PharmacyRole | null;
  plan: PlanCode | null;
  pharmacyStatus: PharmacyStatus | null;
  permissions: string[];
  tokenScope: TokenScope;
};

const EMPTY: SessionSnapshot = {
  pharmacies: [],
  staffId: null,
  staffName: '',
  pharmacyId: null,
  pharmacyName: 'Your pharmacy',
  role: null,
  plan: null,
  pharmacyStatus: null,
  permissions: [],
  tokenScope: 'full',
};

let memory: SessionSnapshot | null = null;
let hydrated = false;

function isRole(value: unknown): value is PharmacyRole {
  return value === 'pharmacy_owner' || value === 'pharmacy_staff';
}

function isPlan(value: unknown): value is PlanCode {
  return (
    value === 'FREE' ||
    value === 'STARTER' ||
    value === 'RETAIL_PRO' ||
    value === 'ENTERPRISE'
  );
}

function isStatus(value: unknown): value is PharmacyStatus {
  return (
    value === 'PENDING_KYC' ||
    value === 'KYC_SUBMITTED' ||
    value === 'ACTIVE' ||
    value === 'REJECTED' ||
    value === 'SUSPENDED'
  );
}

function isScope(value: unknown): value is TokenScope {
  return value === 'full' || value === 'pos';
}

function parsePharmacies(value: unknown): PharmacyOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const rows: PharmacyOption[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Partial<PharmacyOption>;
    if (typeof row.id !== 'string' || typeof row.name !== 'string') {
      continue;
    }
    rows.push({
      id: row.id,
      name: row.name,
      role: typeof row.role === 'string' ? row.role : '',
      isActive: row.isActive !== false,
    });
  }
  return rows;
}

function parseStored(raw: string): SessionSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SessionSnapshot>;
    if (!isScope(parsed.tokenScope)) {
      return null;
    }
    return {
      pharmacies: parsePharmacies(parsed.pharmacies),
      staffId: typeof parsed.staffId === 'string' ? parsed.staffId : null,
      staffName: typeof parsed.staffName === 'string' ? parsed.staffName : '',
      pharmacyId:
        typeof parsed.pharmacyId === 'string' ? parsed.pharmacyId : null,
      pharmacyName:
        typeof parsed.pharmacyName === 'string'
          ? parsed.pharmacyName
          : 'Your pharmacy',
      role: isRole(parsed.role) ? parsed.role : null,
      plan: isPlan(parsed.plan) ? parsed.plan : null,
      pharmacyStatus: isStatus(parsed.pharmacyStatus)
        ? parsed.pharmacyStatus
        : null,
      permissions: Array.isArray(parsed.permissions)
        ? parsed.permissions.filter((item) => typeof item === 'string')
        : [],
      tokenScope: parsed.tokenScope,
    };
  } catch {
    return null;
  }
}

function readStorage(): SessionSnapshot | null {
  try {
    const raw = sessionStorage.getItem(PORTAL_SESSION_SNAPSHOT_KEY);
    if (!raw) {
      return null;
    }
    return parseStored(raw);
  } catch {
    return null;
  }
}

function writeStorage(snapshot: SessionSnapshot | null): void {
  try {
    if (!snapshot) {
      sessionStorage.removeItem(PORTAL_SESSION_SNAPSHOT_KEY);
      return;
    }
    sessionStorage.setItem(
      PORTAL_SESSION_SNAPSHOT_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    // Private mode must not break the in-memory session.
  }
}

export function getSessionSnapshot(): SessionSnapshot | null {
  if (!hydrated) {
    memory = readStorage();
    hydrated = true;
  }
  return memory ? { ...memory, pharmacies: [...memory.pharmacies] } : null;
}

export function setSessionSnapshot(snapshot: SessionSnapshot): void {
  memory = {
    ...snapshot,
    pharmacies: [...snapshot.pharmacies],
    permissions: [...snapshot.permissions],
  };
  hydrated = true;
  writeStorage(memory);
}

export function clearSessionSnapshot(): void {
  memory = { ...EMPTY, pharmacies: [] };
  hydrated = true;
  writeStorage(null);
}

export function resetSessionSnapshot(): void {
  memory = null;
  hydrated = false;
  writeStorage(null);
}

export function snapshotFromSession(
  session: {
    staffId: string | null;
    staffName: string;
    pharmacyId: string | null;
    pharmacyName: string;
    role: PharmacyRole | null;
    plan: PlanCode | null;
    pharmacyStatus: PharmacyStatus | null;
    permissions: readonly string[];
    tokenScope: TokenScope;
  },
  pharmacies: readonly PharmacyOption[],
): SessionSnapshot {
  return {
    pharmacies: [...pharmacies],
    staffId: session.staffId,
    staffName: session.staffName,
    pharmacyId: session.pharmacyId,
    pharmacyName: session.pharmacyName,
    role: session.role,
    plan: session.plan,
    pharmacyStatus: session.pharmacyStatus,
    permissions: [...session.permissions],
    tokenScope: session.tokenScope,
  };
}
