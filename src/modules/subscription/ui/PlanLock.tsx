import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { PlanLockFeature } from '@medmate/subscription-contract';
import { track } from '@/modules/api';
import { LockGlyph } from '@/modules/shell/lib/icons';
import {
  formatPlanLockCopy,
  useSession,
  type PlanCode,
} from '@/modules/session';
import {
  isPermissionLock,
  navLockTelemetryCode,
  planLockMinimum,
  shouldShowUpgradeCta,
} from '@/modules/subscription/lib/plan-lock';

export type PlanLockProps = {
  variant?: 'nav' | 'panel';
  navClassName?: string;
  itemId?: string;
  itemLabel: string;
  lockCopy?: string;
  minimum?: PlanCode;
  feature?: PlanLockFeature;
  code?: string;
  children?: string;
};

export function PlanLock({
  variant = 'panel',
  navClassName,
  itemId,
  itemLabel,
  lockCopy,
  minimum,
  feature,
  code,
  children,
}: PlanLockProps) {
  const session = useSession();
  const explanationRef = useRef<HTMLParagraphElement>(null);
  const explanationId = `nav-lock-${itemId ?? itemLabel.toLowerCase()}`;
  const resolvedMinimum = minimum ?? planLockMinimum(feature);
  const permissionOnly = isPermissionLock(code);
  const showUpgrade = shouldShowUpgradeCta(code, session.role);
  const copy =
    lockCopy ??
    (permissionOnly
      ? 'You do not have permission to do that.'
      : formatPlanLockCopy(itemLabel, resolvedMinimum, session));
  const telemetryCode = code ?? navLockTelemetryCode();

  useEffect(() => {
    if (permissionOnly) {
      return;
    }
    track('plan_lock_shown', { code: telemetryCode });
  }, [permissionOnly, telemetryCode]);

  if (variant === 'panel') {
    return (
      <section className="plan-lock" data-testid="plan-lock">
        <p id={explanationId} className="nav-lock__explain">
          {copy}
          {showUpgrade ? (
            <>
              {' '}
              <Link to="/subscription">Upgrade</Link>
            </>
          ) : null}
        </p>
      </section>
    );
  }

  return (
    <div className="nav-lock">
      <button
        type="button"
        className={navClassName}
        data-testid="plan-lock"
        aria-describedby={explanationId}
        onClick={() => explanationRef.current?.focus()}
      >
        {children ?? itemLabel}
        <span className="nav-lock__badge">
          <LockGlyph /> Locked
        </span>
      </button>
      <p
        id={explanationId}
        ref={explanationRef}
        tabIndex={-1}
        className="nav-lock__explain"
      >
        {copy}
        {showUpgrade ? (
          <>
            {' '}
            <Link to="/subscription">Upgrade</Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
