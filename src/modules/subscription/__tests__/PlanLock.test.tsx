import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionProvider, SESSION_FIXTURES } from '@/modules/session';
import { PlanLock } from '@/modules/subscription/ui/PlanLock';
import { subscribeTelemetry } from '@/modules/api';

afterEach(() => {
  cleanup();
});

function wrap(
  ui: ReactElement,
  session = SESSION_FIXTURES['owner-free'],
) {
  return render(
    <MemoryRouter>
      <SessionProvider session={session}>{ui}</SessionProvider>
    </MemoryRouter>,
  );
}

describe('PlanLock', () => {
  it('shows Starter+ and an upgrade link for khata locks', () => {
    const sink = vi.fn();
    const stop = subscribeTelemetry(sink);
    wrap(
      <PlanLock
        itemLabel="Khata"
        feature="khata"
        code="PLAN_FEATURE_LOCKED"
      />,
    );
    expect(screen.getByTestId('plan-lock')).toBeTruthy();
    expect(screen.getByText(/Starter/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Upgrade' })).toHaveAttribute(
      'href',
      '/subscription',
    );
    expect(sink).toHaveBeenCalledWith('plan_lock_shown', {
      code: 'PLAN_FEATURE_LOCKED',
    });
    stop();
  });

  it('maps analytics to Growth+ and MODULE_NOT_IN_PLAN the same way', () => {
    wrap(
      <PlanLock
        itemLabel="Analytics"
        feature="analytics"
        code="PLAN_UPGRADE_REQUIRED"
      />,
    );
    expect(screen.getByText(/Growth/)).toBeTruthy();
    wrap(
      <PlanLock
        itemLabel="Offers"
        feature="offers"
        code="MODULE_NOT_IN_PLAN"
      />,
    );
    expect(screen.getAllByRole('link', { name: 'Upgrade' }).length).toBeGreaterThan(
      0,
    );
  });

  it('hides the upgrade link for permission denials and staff', () => {
    wrap(
      <PlanLock
        itemLabel="Roles"
        code="INSUFFICIENT_PERMISSIONS"
      />,
    );
    expect(screen.queryByRole('link', { name: 'Upgrade' })).toBeNull();
    expect(screen.getByText(/permission/)).toBeTruthy();
    cleanup();
    wrap(
      <PlanLock
        variant="nav"
        itemId="khata"
        itemLabel="Khata"
        lockCopy="Khata needs Starter. Ask the pharmacy owner to upgrade."
        code="PLAN_FEATURE_LOCKED"
      />,
      SESSION_FIXTURES.cashier,
    );
    expect(screen.queryByRole('link', { name: 'Upgrade' })).toBeNull();
    expect(screen.getByText(/Ask the pharmacy owner/)).toBeTruthy();
  });

  it('uses nav children and default lock telemetry', async () => {
    const user = userEvent.setup();
    const sink = vi.fn();
    const stop = subscribeTelemetry(sink);
    wrap(
      <PlanLock variant="nav" itemId="offers" itemLabel="Offers">
        Offers
      </PlanLock>,
    );
    await user.click(screen.getByRole('button', { name: /Offers/ }));
    expect(document.activeElement?.id).toBe('nav-lock-offers');
    expect(sink).toHaveBeenCalledWith('plan_lock_shown', {
      code: 'PLAN_FEATURE_LOCKED',
    });
    stop();
    cleanup();
    const permissionSink = vi.fn();
    const stopPermission = subscribeTelemetry(permissionSink);
    wrap(
      <PlanLock itemLabel="Roles" code="INSUFFICIENT_PERMISSIONS" />,
    );
    expect(permissionSink).not.toHaveBeenCalled();
    stopPermission();
  });
});
