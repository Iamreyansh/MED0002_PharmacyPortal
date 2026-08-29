import { describe, expect, it } from 'vitest';
import {
  isCommercialPlanLock,
  isPermissionLock,
  navLockTelemetryCode,
  planLockMinimum,
  shouldShowUpgradeCta,
} from '@/modules/subscription/lib/plan-lock';

describe('plan lock mapping', () => {
  it('treats commercial codes as locks and permissions as not', () => {
    expect(isCommercialPlanLock('PLAN_FEATURE_LOCKED')).toBe(true);
    expect(isCommercialPlanLock('PLAN_UPGRADE_REQUIRED')).toBe(true);
    expect(isCommercialPlanLock('MODULE_NOT_IN_PLAN')).toBe(true);
    expect(isCommercialPlanLock('INSUFFICIENT_PERMISSIONS')).toBe(false);
    expect(isPermissionLock('INSUFFICIENT_PERMISSIONS')).toBe(true);
    expect(isPermissionLock('FORBIDDEN')).toBe(true);
    expect(shouldShowUpgradeCta('PLAN_FEATURE_LOCKED', 'pharmacy_owner')).toBe(
      true,
    );
    expect(shouldShowUpgradeCta('INSUFFICIENT_PERMISSIONS', 'pharmacy_owner')).toBe(
      false,
    );
    expect(shouldShowUpgradeCta('MODULE_NOT_IN_PLAN', 'pharmacy_staff')).toBe(
      false,
    );
    expect(planLockMinimum('khata')).toBe('STARTER');
    expect(planLockMinimum('analytics')).toBe('RETAIL_PRO');
    expect(planLockMinimum()).toBe('STARTER');
    expect(navLockTelemetryCode()).toBe('PLAN_FEATURE_LOCKED');
  });
});
