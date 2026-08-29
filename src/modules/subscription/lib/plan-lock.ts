import {
  isPermissionDeniedCode,
  isPlanLockCode,
  minimumPlanForFeature,
  type PlanLockFeature,
} from '@medmate/subscription-contract';
import type { PlanCode } from '@/modules/session';

export function isPermissionLock(code: string | undefined): boolean {
  return isPermissionDeniedCode(code);
}

export function isCommercialPlanLock(code: string | undefined): boolean {
  return isPlanLockCode(code);
}

export function planLockMinimum(feature?: PlanLockFeature): PlanCode {
  return feature ? minimumPlanForFeature(feature) : 'STARTER';
}

export function shouldShowUpgradeCta(
  code: string | undefined,
  role: string | null,
): boolean {
  if (isPermissionLock(code)) {
    return false;
  }
  return role !== 'pharmacy_staff';
}

export function navLockTelemetryCode(): string {
  return 'PLAN_FEATURE_LOCKED';
}
