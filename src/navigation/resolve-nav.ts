import {
  formatPlanLockCopy,
  hasPermission,
  isPlanBelowMinimum,
  type PortalSession,
} from '@/session/session';
import {
  NAV_CATALOG,
  NAV_GROUP_ORDER,
  type NavGroupId,
  type NavItem,
} from '@/navigation/nav-catalog';

export type ResolvedNavItem = NavItem & {
  locked: boolean;
  lockCopy?: string;
};

export function resolveNavItems(
  session: PortalSession,
  catalog: readonly NavItem[] = NAV_CATALOG,
): ResolvedNavItem[] {
  if (session.tokenScope === 'pos') {
    return catalog
      .filter((item) => item.posAllowed)
      .map((item) => ({ ...item, locked: false }));
  }

  const resolved: ResolvedNavItem[] = [];
  for (const item of catalog) {
    if (item.showWhenNotActive) {
      if (
        session.authenticated &&
        session.pharmacyStatus &&
        session.pharmacyStatus !== 'ACTIVE'
      ) {
        resolved.push({ ...item, locked: false });
      }
      continue;
    }

    if (!session.authenticated) {
      resolved.push({ ...item, locked: false });
      continue;
    }

    if (item.requirePharmacyActive && session.pharmacyStatus !== 'ACTIVE') {
      continue;
    }
    if (item.ownerOnly && session.role !== 'pharmacy_owner') {
      continue;
    }
    if (!hasPermission(session, item.permission)) {
      continue;
    }

    const locked = item.minPlan
      ? isPlanBelowMinimum(session.plan, item.minPlan)
      : false;
    resolved.push({
      ...item,
      locked,
      lockCopy:
        locked && item.minPlan
          ? formatPlanLockCopy(item.label, item.minPlan, session)
          : undefined,
    });
  }
  return resolved;
}

export function groupNavItems(
  items: readonly ResolvedNavItem[],
): { group: NavGroupId; items: ResolvedNavItem[] }[] {
  return NAV_GROUP_ORDER.map((group) => ({
    group,
    items: items.filter((item) => item.group === group),
  })).filter((entry) => entry.items.length > 0);
}

export function homeShortcuts(
  items: readonly ResolvedNavItem[],
): ResolvedNavItem[] {
  return items.filter((item) => item.homeShortcut);
}
