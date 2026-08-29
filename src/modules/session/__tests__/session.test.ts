import { can } from '@medmate/contracts';
import { describe, expect, it } from 'vitest';
import {
  formatPlanLockCopy,
  hasPermission,
  isPlanBelowMinimum,
  isSessionFixtureName,
  mapPharmacyRole,
  mapPharmacyStatus,
  mapPlanCode,
  planDisplayLabel,
  readSessionFixture,
  SESSION_FIXTURES,
  UNAUTHENTICATED_SESSION,
} from '@/modules/session';

describe('plan helpers', () => {
  it('maps runtime plan codes to display labels', () => {
    expect(planDisplayLabel('FREE')).toBe('Free');
    expect(planDisplayLabel('STARTER')).toBe('Starter');
    expect(planDisplayLabel('RETAIL_PRO')).toBe('Growth');
    expect(planDisplayLabel('ENTERPRISE')).toBe('Pro');
  });

  it('compares plan floors', () => {
    expect(isPlanBelowMinimum(null, 'STARTER')).toBe(true);
    expect(isPlanBelowMinimum('FREE', 'STARTER')).toBe(true);
    expect(isPlanBelowMinimum('STARTER', 'STARTER')).toBe(false);
    expect(isPlanBelowMinimum('ENTERPRISE', 'RETAIL_PRO')).toBe(false);
  });

  it('uses display labels in lock copy, including Pro', () => {
    expect(
      formatPlanLockCopy(
        'Analytics',
        'RETAIL_PRO',
        SESSION_FIXTURES['owner-enterprise'],
      ),
    ).toContain('Pro');
    expect(
      formatPlanLockCopy('Khata', 'STARTER', SESSION_FIXTURES['owner-free']),
    ).toMatch(/Starter/);
    expect(
      formatPlanLockCopy('Khata', 'STARTER', SESSION_FIXTURES.cashier),
    ).toMatch(/Ask the pharmacy owner/);
    expect(
      formatPlanLockCopy('Khata', 'STARTER', {
        ...SESSION_FIXTURES['owner-free'],
        plan: null,
      }),
    ).toContain('Free');
  });
});

describe('permissions', () => {
  it('treats owner and star as granted except via ownerOnly callers', () => {
    expect(hasPermission(SESSION_FIXTURES['owner-free'])).toBe(true);
    expect(hasPermission(SESSION_FIXTURES.cashier, 'staff:manage')).toBe(false);
    expect(hasPermission(SESSION_FIXTURES['staff-star'], 'staff:manage')).toBe(
      true,
    );
    expect(hasPermission(SESSION_FIXTURES['owner-free'], 'staff:manage')).toBe(
      true,
    );
  });

  it('matches cashier, pharmacist, owner, empty, and wildcards', () => {
    expect(can(SESSION_FIXTURES.cashier.permissions, 'inventory:write')).toBe(
      false,
    );
    expect(can(['*'], 'reports:read')).toBe(true);
    expect(
      can(SESSION_FIXTURES.pharmacist.permissions, 'prescriptions:verify'),
    ).toBe(true);
    expect(can([], 'orders:read')).toBe(false);
    expect(can([], undefined)).toBe(true);
    expect(can(['inventory:*'], 'inventory:write')).toBe(true);
    expect(can(['inventory:*'], 'inventory:read')).toBe(true);
    expect(hasPermission(SESSION_FIXTURES.cashier, 'inventory:write')).toBe(
      false,
    );
    expect(hasPermission(SESSION_FIXTURES['owner-free'], 'reports:read')).toBe(
      true,
    );
    expect(
      hasPermission(SESSION_FIXTURES.pharmacist, 'prescriptions:verify'),
    ).toBe(true);
    expect(
      hasPermission(
        { ...SESSION_FIXTURES.cashier, permissions: [] },
        'orders:read',
      ),
    ).toBe(false);
    expect(
      hasPermission(
        { ...SESSION_FIXTURES.cashier, permissions: [] },
        undefined,
      ),
    ).toBe(true);
    expect(
      hasPermission(
        {
          ...SESSION_FIXTURES.pharmacist,
          permissions: ['inventory:*'],
        },
        'inventory:write',
      ),
    ).toBe(true);
  });

  it('ignores non-POS grants when the token is POS-scoped', () => {
    expect(
      hasPermission(SESSION_FIXTURES['pos-scope'], 'inventory:write'),
    ).toBe(false);
    expect(hasPermission(SESSION_FIXTURES['pos-scope'], 'pos:sell')).toBe(true);
    expect(
      hasPermission(
        {
          ...SESSION_FIXTURES['pos-scope'],
          permissions: ['*', 'inventory:write'],
        },
        'inventory:write',
      ),
    ).toBe(false);
  });
});

describe('session fixtures', () => {
  it('reads named fixtures and falls back', () => {
    expect(isSessionFixtureName('owner-free')).toBe(true);
    expect(isSessionFixtureName('pharmacist')).toBe(true);
    expect(isSessionFixtureName('nope')).toBe(false);
    expect(readSessionFixture('owner-free')).toEqual(
      SESSION_FIXTURES['owner-free'],
    );
    expect(readSessionFixture('unknown')).toEqual(UNAUTHENTICATED_SESSION);
    expect(readSessionFixture(undefined)).toEqual(UNAUTHENTICATED_SESSION);
  });
});

describe('Core mappers', () => {
  it('maps Core roles and plans', () => {
    expect(mapPharmacyRole('owner')).toBe('pharmacy_owner');
    expect(mapPharmacyRole('pharmacy_owner')).toBe('pharmacy_owner');
    expect(mapPharmacyRole('pharmacist')).toBe('pharmacy_staff');
    expect(mapPlanCode('GROWTH')).toBe('RETAIL_PRO');
    expect(mapPlanCode('PRO')).toBe('ENTERPRISE');
    expect(mapPlanCode('FREE')).toBe('FREE');
    expect(mapPlanCode('STARTER')).toBe('STARTER');
    expect(mapPlanCode('RETAIL_PRO')).toBe('RETAIL_PRO');
    expect(mapPlanCode('ENTERPRISE')).toBe('ENTERPRISE');
    expect(mapPlanCode('nope')).toBeNull();
    expect(mapPharmacyStatus('PENDING_KYC')).toBe('PENDING_KYC');
    expect(mapPharmacyStatus('KYC_SUBMITTED')).toBe('KYC_SUBMITTED');
    expect(mapPharmacyStatus('ACTIVE')).toBe('ACTIVE');
    expect(mapPharmacyStatus('REJECTED')).toBe('REJECTED');
    expect(mapPharmacyStatus('SUSPENDED')).toBe('SUSPENDED');
    expect(mapPharmacyStatus('nope')).toBeNull();
    expect(mapPharmacyStatus(1)).toBeNull();
  });
});
