import { describe, expect, it } from 'vitest';
import { NAV_CATALOG, productNavIncludesTodo } from '@/modules/navigation';
import {
  groupNavItems,
  homeShortcuts,
  resolveNavItems,
} from '@/modules/navigation';
import { SESSION_FIXTURES } from '@/modules/session';

describe('nav catalog', () => {
  it('excludes Todo from product navigation', () => {
    expect(productNavIncludesTodo()).toBe(false);
    expect(
      productNavIncludesTodo([
        {
          id: 'todo',
          path: '/todos',
          label: 'Todos',
          group: 'settings',
        },
      ]),
    ).toBe(true);
    expect(
      productNavIncludesTodo([
        {
          id: 'x',
          path: '/todos',
          label: 'Other',
          group: 'settings',
        },
      ]),
    ).toBe(true);
    expect(
      productNavIncludesTodo([
        {
          id: 'y',
          path: '/else',
          label: 'Todos',
          group: 'settings',
        },
      ]),
    ).toBe(true);
  });
});

describe('resolveNavItems', () => {
  it('omits Roles for cashier permissions', () => {
    const items = resolveNavItems(SESSION_FIXTURES.cashier);
    expect(items.some((item) => item.id === 'roles')).toBe(false);
  });

  it('locks Khata on Free and enables Analytics on Growth', () => {
    const free = resolveNavItems(SESSION_FIXTURES['owner-free']);
    const khata = free.find((item) => item.id === 'khata');
    expect(khata?.locked).toBe(true);
    expect(khata?.lockCopy).toMatch(/Starter/);
    expect(khata?.lockCopy).not.toMatch(/STARTER/);

    const growth = resolveNavItems(SESSION_FIXTURES['owner-retail-pro']);
    expect(growth.find((item) => item.id === 'analytics')?.locked).toBe(false);
  });

  it('limits POS scope to POS', () => {
    const items = resolveNavItems(SESSION_FIXTURES['pos-scope']);
    expect(items.map((item) => item.id)).toEqual(['pos']);
  });

  it('omits marketplace quotes and shows KYC when pending', () => {
    const items = resolveNavItems(SESSION_FIXTURES['owner-pending-kyc']);
    expect(items.some((item) => item.id === 'rx-quotes')).toBe(false);
    expect(items.some((item) => item.id === 'orders')).toBe(false);
    expect(items.some((item) => item.id === 'kyc')).toBe(true);
  });

  it('omits Settlements for staff even with star permissions', () => {
    const items = resolveNavItems(SESSION_FIXTURES['staff-star']);
    expect(items.some((item) => item.id === 'settlements')).toBe(false);
    expect(items.some((item) => item.id === 'saas-billing')).toBe(false);
    expect(items.some((item) => item.id === 'roles')).toBe(true);
  });

  it('shows KYC only when pharmacy is not ACTIVE', () => {
    const active = resolveNavItems(SESSION_FIXTURES['owner-free']);
    expect(active.some((item) => item.id === 'kyc')).toBe(false);
    const unauth = resolveNavItems(SESSION_FIXTURES.unauthenticated);
    expect(unauth.some((item) => item.id === 'kyc')).toBe(false);
    expect(unauth.some((item) => item.id === 'pos')).toBe(true);
  });

  it('groups items and lists home shortcuts', () => {
    const items = resolveNavItems(SESSION_FIXTURES['owner-free']);
    expect(items.some((item) => item.id === 'saas-billing')).toBe(true);
    const groups = groupNavItems(items);
    expect(groups.map((group) => group.group)).toContain('counter');
    expect(homeShortcuts(items).some((item) => item.id === 'pos')).toBe(true);
    expect(groupNavItems([]).length).toBe(0);
  });

  it('uses the provided catalog argument', () => {
    const items = resolveNavItems(SESSION_FIXTURES['owner-free'], NAV_CATALOG);
    expect(items.length).toBeGreaterThan(0);
  });
});
