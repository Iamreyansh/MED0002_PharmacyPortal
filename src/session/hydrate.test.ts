import { describe, expect, it } from 'vitest';
import { sessionFromLogin, sessionFromMe, sessionFromPosPin } from '@/session/hydrate';
import { UNAUTHENTICATED_SESSION } from '@/session/session';

describe('session hydrate', () => {
  it('maps a login envelope into session state', () => {
    const result = sessionFromLogin(
      {
        staff: { id: 'u1', name: 'Priya Sharma', role: 'pharmacy_owner' },
        active_pharmacy: {
          id: 'p1',
          name: 'Sri Rama Medicals',
          subscription_plan: 'GROWTH',
        },
        pharmacies: [
          { id: 'p1', name: 'Sri Rama Medicals', role: 'owner', is_active: true },
          { id: 'p2', name: 'Other', role: 'pharmacist', is_active: false },
        ],
      },
      'full',
    );
    expect(result.session.staffName).toBe('Priya Sharma');
    expect(result.session.staffId).toBe('u1');
    expect(result.session.pharmacyId).toBe('p1');
    expect(result.session.plan).toBe('RETAIL_PRO');
    expect(result.pharmacies).toHaveLength(2);
    expect(result.pharmacies[1]?.isActive).toBe(false);
  });

  it('keeps pharmacies from the previous snapshot on me', () => {
    const login = sessionFromLogin(
      {
        staff: { id: 'u1', name: 'Priya', role: 'owner' },
        active_pharmacy: { id: 'p1', name: 'Shop' },
        pharmacies: [{ id: 'p1', name: 'Shop', is_active: true }],
      },
      'full',
    );
    const me = sessionFromMe(
      {
        id: 'u1',
        name: 'Priya Sharma',
        role: 'pharmacist',
        permissions: ['pos:sell'],
        active_pharmacy: { id: 'p1', name: 'Shop' },
      },
      login.session,
      login.pharmacies,
    );
    expect(me.session.staffName).toBe('Priya Sharma');
    expect(me.session.role).toBe('pharmacy_staff');
    expect(me.pharmacies).toEqual(login.pharmacies);
  });

  it('maps a POS PIN payload to pos scope', () => {
    const result = sessionFromPosPin({
      token_scope: 'pos',
      staff: { id: 's1', name: 'Kavya', role: 'cashier' },
      pharmacy: { id: 'p1', name: 'Counter' },
    });
    expect(result.session.tokenScope).toBe('pos');
    expect(result.session.staffName).toBe('Kavya');
    expect(result.session.pharmacyName).toBe('Counter');
    expect(result.session).not.toEqual(UNAUTHENTICATED_SESSION);
  });
});
