import { describe, expect, it } from 'vitest';
import {
  applyRegistrationStatus,
  hydrateInitialSession,
  sessionFromLogin,
  sessionFromMe,
  sessionFromPosPin,
  sessionFromSwitch,
} from '@/modules/session';
import { UNAUTHENTICATED_SESSION } from '@/modules/session';
import { setTokens } from '@/modules/api';
import { resetSessionSnapshot, setSessionSnapshot } from '@/modules/session';

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
          {
            id: 'p1',
            name: 'Sri Rama Medicals',
            role: 'owner',
            is_active: true,
          },
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

  it('maps switch and registration payloads and hydrates from snapshot', () => {
    const login = sessionFromLogin(
      {
        staff: { role: 'pharmacist' },
        active_pharmacy: { id: 'p1', name: 'Shop' },
        pharmacies: 'bad',
      },
      'full',
    );
    expect(login.pharmacies).toEqual([]);
    const switched = sessionFromSwitch(
      {
        role_in_pharmacy: 'owner',
        active_pharmacy: { id: 'p2', name: 'Other', subscription_plan: 'FREE' },
      },
      login.session,
      [{ id: 'p2', name: 'Other', role: 'pharmacy_owner', isActive: true }],
    );
    expect(switched.session.pharmacyId).toBe('p2');
    expect(switched.session.role).toBe('pharmacy_owner');
    const status = applyRegistrationStatus(
      {
        status: 'ACTIVE',
        plan: 'STARTER',
        business_name: 'Named',
        pharmacy_id: 'p9',
      },
      switched.session,
    );
    expect(status.pharmacyStatus).toBe('ACTIVE');
    expect(status.plan).toBe('STARTER');
    expect(hydrateInitialSession().session.authenticated).toBe(false);
    setTokens({
      accessToken: 'a',
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    expect(hydrateInitialSession().session.authenticated).toBe(true);
    setSessionSnapshot({
      pharmacies: [],
      staffId: 'u1',
      staffName: 'Priya',
      pharmacyId: 'p1',
      pharmacyName: 'Shop',
      role: 'pharmacy_owner',
      plan: 'FREE',
      pharmacyStatus: 'ACTIVE',
      permissions: ['*'],
      tokenScope: 'full',
    });
    expect(hydrateInitialSession().session.staffName).toBe('Priya');
    resetSessionSnapshot();
    expect(
      sessionFromMe(
        { id: 'u1', name: 'X', role: 'pharmacy_owner', permissions: [] },
        UNAUTHENTICATED_SESSION,
        [],
      ).session.permissions,
    ).toEqual(['*']);
    const staffKeep = sessionFromMe(
      { permissions: [] },
      {
        ...UNAUTHENTICATED_SESSION,
        permissions: ['pos:sell'],
        staffId: 'prev',
        staffName: 'Prev',
        pharmacyId: 'p-prev',
        pharmacyName: 'Prev shop',
        role: 'pharmacy_staff',
      },
      [],
    );
    expect(staffKeep.session.permissions).toEqual(['pos:sell']);
    expect(staffKeep.session.staffId).toBe('prev');
    expect(staffKeep.session.staffName).toBe('Prev');
    expect(staffKeep.session.pharmacyId).toBe('p-prev');
    expect(staffKeep.session.role).toBe('pharmacy_staff');
    const skipped = sessionFromLogin(
      {
        staff: [],
        active_pharmacy: [],
        pharmacies: [null, { id: 'p1' }, { id: 'p2', name: 'Ok' }],
      },
      'full',
    );
    expect(skipped.pharmacies).toEqual([
      { id: 'p2', name: 'Ok', role: '', isActive: true },
    ]);
    expect(skipped.session.staffName).toBe('');
    const emptyPin = sessionFromPosPin({});
    expect(emptyPin.session.pharmacyName).toBe('Your pharmacy');
    const switchedEmpty = sessionFromSwitch({}, skipped.session, []);
    expect(switchedEmpty.session.pharmacyId).toBe(skipped.session.pharmacyId);
    const statusKeep = applyRegistrationStatus({}, skipped.session);
    expect(statusKeep.plan).toBe(skipped.session.plan);
  });
});
