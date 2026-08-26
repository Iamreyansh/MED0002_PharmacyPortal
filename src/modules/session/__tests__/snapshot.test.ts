import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PORTAL_SESSION_SNAPSHOT_KEY,
  clearSessionSnapshot,
  getSessionSnapshot,
  resetSessionSnapshot,
  setSessionSnapshot,
  snapshotFromSession,
  SESSION_FIXTURES,
} from '@/modules/session';

afterEach(() => {
  resetSessionSnapshot();
  vi.unstubAllGlobals();
});

describe('session snapshot store', () => {
  it('round-trips a snapshot and ignores corrupt storage', () => {
    expect(getSessionSnapshot()).toBeNull();
    setSessionSnapshot(
      snapshotFromSession(SESSION_FIXTURES['owner-free'], [
        {
          id: 'p1',
          name: 'Shop',
          role: 'pharmacy_owner',
          isActive: true,
        },
      ]),
    );
    expect(getSessionSnapshot()?.pharmacyName).toBe(
      SESSION_FIXTURES['owner-free'].pharmacyName,
    );
    resetSessionSnapshot();
    sessionStorage.setItem(PORTAL_SESSION_SNAPSHOT_KEY, '{');
    expect(getSessionSnapshot()).toBeNull();
    resetSessionSnapshot();
    sessionStorage.setItem(
      PORTAL_SESSION_SNAPSHOT_KEY,
      JSON.stringify({ tokenScope: 'nope' }),
    );
    expect(getSessionSnapshot()).toBeNull();
    resetSessionSnapshot();
    sessionStorage.setItem(
      PORTAL_SESSION_SNAPSHOT_KEY,
      JSON.stringify({
        tokenScope: 'full',
        pharmacies: [{ id: 1 }],
        permissions: [1, 'pos:sell'],
        role: 'nope',
        plan: 'nope',
        pharmacyStatus: 'nope',
      }),
    );
    const parsed = getSessionSnapshot();
    expect(parsed?.tokenScope).toBe('full');
    expect(parsed?.permissions).toEqual(['pos:sell']);
    expect(parsed?.pharmacyName).toBe('Your pharmacy');
    resetSessionSnapshot();
    sessionStorage.setItem(
      PORTAL_SESSION_SNAPSHOT_KEY,
      JSON.stringify({
        tokenScope: 'pos',
        pharmacies: [
          { id: 'p1', name: 'Shop', role: 'owner', isActive: false },
          { id: 'p3', name: 'Other' },
          { id: 2, name: 'skip' },
          'nope',
        ],
        staffId: 1,
        staffName: 2,
        pharmacyId: 3,
        pharmacyName: 4,
        role: 'pharmacy_staff',
        plan: 'STARTER',
        pharmacyStatus: 'ACTIVE',
        permissions: 'nope',
      }),
    );
    const typed = getSessionSnapshot();
    expect(typed?.pharmacies).toEqual([
      { id: 'p1', name: 'Shop', role: 'owner', isActive: false },
      { id: 'p3', name: 'Other', role: '', isActive: true },
    ]);
    expect(typed?.staffId).toBeNull();
    expect(typed?.role).toBe('pharmacy_staff');
    expect(typed?.plan).toBe('STARTER');
    expect(typed?.pharmacyStatus).toBe('ACTIVE');
    expect(typed?.permissions).toEqual([]);
    resetSessionSnapshot();
    sessionStorage.setItem(
      PORTAL_SESSION_SNAPSHOT_KEY,
      JSON.stringify({
        tokenScope: 'full',
        pharmacies: 'bad',
        staffId: 'u1',
        staffName: 'Priya',
        pharmacyId: 'p1',
        pharmacyName: 'Named shop',
        role: 'pharmacy_owner',
        plan: 'FREE',
        pharmacyStatus: 'ACTIVE',
        permissions: ['pos:sell'],
      }),
    );
    expect(getSessionSnapshot()?.pharmacyName).toBe('Named shop');
    expect(getSessionSnapshot()?.pharmacies).toEqual([]);
    clearSessionSnapshot();
  });

  it('survives storage failures', () => {
    const boom = () => {
      throw new Error('blocked');
    };
    vi.stubGlobal('sessionStorage', {
      getItem: boom,
      setItem: boom,
      removeItem: boom,
    });
    resetSessionSnapshot();
    expect(getSessionSnapshot()).toBeNull();
    setSessionSnapshot(snapshotFromSession(SESSION_FIXTURES['owner-free'], []));
    expect(getSessionSnapshot()?.staffName).toBe(
      SESSION_FIXTURES['owner-free'].staffName,
    );
    clearSessionSnapshot();
  });
});
