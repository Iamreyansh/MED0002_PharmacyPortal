import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PRODUCT_REMOTE_REGISTRY,
  isSaasPaymentsEnabled,
  listProductRegistry,
} from '@/config';
import { NAV_CATALOG, productNavIncludesTodo } from '@/modules/navigation';
import { planDisplayLabel } from '@/modules/session';

const ROOT = process.cwd();

const EXCLUDED_FRAGMENTS = [
  '/inbox',
  '/invite',
  '/ipd',
  '/kiosk',
  '/notifications/inbox',
  'staff-invite',
  'order-inbox',
];

describe('release checklist', () => {
  it('keeps Todo out of product nav and the product remote registry', () => {
    expect(productNavIncludesTodo()).toBe(false);
    expect(productNavIncludesTodo(NAV_CATALOG)).toBe(false);
    const names = Object.keys(PRODUCT_REMOTE_REGISTRY);
    expect(names).not.toContain('todo');
    expect(listProductRegistry().some((remote) => remote.name === 'todo')).toBe(
      false,
    );
  });

  it('maps RETAIL_PRO copy to Growth', () => {
    expect(planDisplayLabel('RETAIL_PRO')).toBe('Growth');
  });

  it('keeps SaaS payments fail-closed unless explicitly enabled', () => {
    expect(isSaasPaymentsEnabled({})).toBe(false);
    expect(isSaasPaymentsEnabled({ VITE_SAAS_PAYMENTS_ENABLED: 'true' })).toBe(
      true,
    );
  });

  it('does not ship excluded inbox, invite, IPD, or kiosk routes', () => {
    const navBlob = NAV_CATALOG.map(
      (item) => `${item.id} ${item.path} ${item.label}`,
    ).join('\n');
    const routes = fs.readFileSync(
      path.join(ROOT, 'src/app/router/routes.tsx'),
      'utf8',
    );
    for (const fragment of EXCLUDED_FRAGMENTS) {
      expect(navBlob.toLowerCase()).not.toContain(fragment);
      expect(routes.toLowerCase()).not.toContain(fragment);
    }
  });

  it('keeps payment secrets out of .env.example', () => {
    const example = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');
    expect(example).not.toMatch(/CASHFREE_SECRET_KEY/);
    expect(example).not.toMatch(/CASHFREE_SECRET/);
    expect(example).not.toMatch(/SECRET_KEY=/);
    expect(example).not.toMatch(/PAYMENT_SECRET/);
  });

  it('smoke script does not require Todo and checks host auth', () => {
    const smoke = fs.readFileSync(
      path.join(ROOT, 'scripts/post-deploy-smoke.sh'),
      'utf8',
    );
    expect(smoke).not.toMatch(/todos/i);
    expect(smoke).toContain('/login');
    expect(smoke).toContain('/api/v1/auth/me');
    expect(smoke).toContain('runtime-config.json');
  });
});
