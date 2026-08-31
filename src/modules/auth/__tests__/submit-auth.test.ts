import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthCommand, AuthSubmitResult } from '@medmate/auth-contract';
import { getTokens, hostApi, resetTokenStore } from '@/modules/api';
import { resetSessionSnapshot } from '@/modules/session';
import { readPosLastIds, writePosLastIds } from '@/modules/auth/lib/pos-last';
import {
  resetPharmacySubmit,
  submitPharmacy,
} from '@/modules/auth/lib/submit-pharmacy';
import {
  resetForgotSubmit,
  submitForgot,
} from '@/modules/auth/lib/submit-forgot';
import {
  resetCompleteSubmit,
  submitReset,
} from '@/modules/auth/lib/submit-reset';
import { resetPosSubmit, submitPos } from '@/modules/auth/lib/submit-pos';
import {
  asSessionRows,
  submitSessions,
  toAuthSessionRow,
} from '@/modules/auth/lib/submit-sessions';

function failCopy(result: AuthSubmitResult): string | undefined {
  return result.ok ? undefined : result.formError;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetTokenStore();
  resetSessionSnapshot();
  resetPharmacySubmit();
  resetForgotSubmit();
  resetCompleteSubmit();
  resetPosSubmit();
  sessionStorage.removeItem('medmate.portal.pos-last');
});

const pharmacyLogin: AuthCommand = {
  portalType: 'pharmacy',
  action: 'login',
  values: { identifier: 'priya@srirama.in', password: 'Secret123!' },
};

describe('pos-last', () => {
  it('reads, writes, and survives bad storage', () => {
    expect(readPosLastIds()).toEqual({ pharmacyId: '', staffId: '' });
    writePosLastIds('p1', 's1');
    expect(readPosLastIds()).toEqual({ pharmacyId: 'p1', staffId: 's1' });
    sessionStorage.setItem('medmate.portal.pos-last', '{');
    expect(readPosLastIds()).toEqual({ pharmacyId: '', staffId: '' });
    sessionStorage.setItem(
      'medmate.portal.pos-last',
      JSON.stringify({ pharmacyId: 1, staffId: 2 }),
    );
    expect(readPosLastIds()).toEqual({ pharmacyId: '', staffId: '' });
    const setItem = vi.fn(() => {
      throw new Error('blocked');
    });
    vi.stubGlobal('sessionStorage', {
      getItem: () => null,
      setItem,
      removeItem: () => undefined,
    });
    writePosLastIds('p', 's');
    expect(setItem).toHaveBeenCalled();
  });
});

describe('submitPharmacy', () => {
  it('rejects unsupported commands and in-flight duplicates', async () => {
    expect(
      await submitPharmacy(
        {
          portalType: 'pos',
          action: 'login',
          values: {
            pharmacyId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            staffId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
            pin: '1234',
          },
        },
        { applyLogin: vi.fn(), navigate: vi.fn(), search: '' },
      ),
    ).toMatchObject({ ok: false });
    let finish: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      ),
    );
    const first = submitPharmacy(pharmacyLogin, {
      applyLogin: vi.fn(),
      navigate: vi.fn(),
      search: '',
    });
    const second = await submitPharmacy(pharmacyLogin, {
      applyLogin: vi.fn(),
      navigate: vi.fn(),
      search: '',
    });
    expect(failCopy(second)).toBe('Sign-in is already in progress.');
    finish?.(
      new Response(
        JSON.stringify({ success: true, data: { access_token: 'a' } }),
        {
          status: 200,
        },
      ),
    );
    await first;
  });

  it('returns all client field errors together', async () => {
    const deps = { applyLogin: vi.fn(), navigate: vi.fn(), search: '' };
    expect(
      await submitPharmacy(
        {
          portalType: 'pharmacy',
          action: 'login',
          values: { identifier: '', password: '' },
        },
        deps,
      ),
    ).toMatchObject({
      fieldErrors: {
        identifier: 'Enter your email or +91 mobile number.',
        password: 'Enter your password.',
      },
    });
    expect(
      await submitPharmacy(
        {
          portalType: 'pharmacy',
          action: 'login',
          values: { identifier: 'priya@srirama.in', password: '' },
        },
        deps,
      ),
    ).toMatchObject({
      fieldErrors: { password: 'Enter your password.' },
    });
  });

  it('treats a token-less success as a sign-in failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: true, data: { staff: {} } }), {
            status: 200,
          }),
      ),
    );
    const result = await submitPharmacy(pharmacyLogin, {
      applyLogin: vi.fn(),
      navigate: vi.fn(),
      search: '',
    });
    expect(result.ok).toBe(false);
    expect(getTokens().accessToken).toBeNull();
  });

  it('maps 429 copy with and without Retry-After', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ success: false, error: { code: 'RATE_LIMITED' } }),
            {
              status: 429,
            },
          ),
      ),
    );
    const plain = await submitPharmacy(pharmacyLogin, {
      applyLogin: vi.fn(),
      navigate: vi.fn(),
      search: '',
    });
    expect(failCopy(plain)).toMatch(/Too many attempts/);
  });

  it('honours a safe return path', async () => {
    const navigate = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: {
                access_token: 'access',
                refresh_token: 'refresh',
                token_type: 'Bearer',
                active_pharmacy: {
                  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                  name: 'Sri Rama Medicals',
                  subscription_plan: 'FREE',
                  status: 'ACTIVE',
                },
                staff: {
                  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                  name: 'Priya',
                  role: 'pharmacy_owner',
                },
                pharmacies: [],
              },
            }),
            { status: 200 },
          ),
      ),
    );
    await submitPharmacy(pharmacyLogin, {
      applyLogin: vi.fn(),
      navigate,
      search: '?return=/settings',
    });
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });
});

describe('submitPos', () => {
  it('rejects unsupported commands and in-flight duplicates', async () => {
    expect(
      await submitPos(pharmacyLogin, {
        applyPosLogin: vi.fn(),
        navigate: vi.fn(),
      }),
    ).toMatchObject({ ok: false });
    const command: AuthCommand = {
      portalType: 'pos',
      action: 'login',
      values: {
        pharmacyId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        staffId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        pin: '1234',
      },
    };
    let finish: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      ),
    );
    const first = submitPos(command, {
      applyPosLogin: vi.fn(),
      navigate: vi.fn(),
    });
    const second = await submitPos(command, {
      applyPosLogin: vi.fn(),
      navigate: vi.fn(),
    });
    expect(failCopy(second)).toBe('Sign-in is already in progress.');
    finish?.(
      new Response(
        JSON.stringify({
          success: true,
          data: { access_token: 'pos', token_scope: 'pos' },
        }),
        { status: 200 },
      ),
    );
    await first;
  });

  it('treats a token-less POS success as a failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: true, data: { staff: {} } }), {
            status: 200,
          }),
      ),
    );
    const result = await submitPos(
      {
        portalType: 'pos',
        action: 'login',
        values: {
          pharmacyId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          staffId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          pin: '1234',
        },
      },
      { applyPosLogin: vi.fn(), navigate: vi.fn() },
    );
    expect(result.ok).toBe(false);
  });
});

describe('submitSessions', () => {
  it('maps rows, empty payloads, and list errors', async () => {
    expect(asSessionRows({ nope: true })).toEqual([]);
    expect(
      asSessionRows(['skip', { nope: true }, { session_id: 's1' }]),
    ).toEqual([{ session_id: 's1' }]);
    expect(
      toAuthSessionRow({
        session_id: 's1',
        device: { platform: 'iOS' },
        city: 'Bengaluru',
        country: 'IN',
        last_active_at: '2026-08-26T12:00:00.000Z',
        is_current: true,
      }).device,
    ).toBe('iOS');
    expect(
      toAuthSessionRow({ session_id: 's2', user_agent: 'Chrome' }).device,
    ).toBe('Chrome');
    expect(toAuthSessionRow({ session_id: 's3' }).location).toBeUndefined();

    const navigate = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: { code: 'UNAUTHORIZED' },
            }),
            { status: 401 },
          ),
      ),
    );
    const denied = await submitSessions(
      { portalType: 'sessions', action: 'list', values: { page: 1 } },
      { navigate, clearSession: vi.fn() },
    );
    expect(denied.ok).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true });

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: { code: 'DOWNSTREAM' },
            }),
            { status: 500 },
          ),
      ),
    );
    const down = await submitSessions(
      { portalType: 'sessions', action: 'list' },
      { navigate: vi.fn(), clearSession: vi.fn() },
    );
    expect(failCopy(down)).toBe('DOWNSTREAM');

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: false }), { status: 500 }),
      ),
    );
    const unknown = await submitSessions(
      { portalType: 'sessions', action: 'list' },
      { navigate: vi.fn(), clearSession: vi.fn() },
    );
    expect(failCopy(unknown)).toBe('UNKNOWN');
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 500,
      data: [],
    });
    expect(
      failCopy(
        await submitSessions(
          { portalType: 'sessions', action: 'list' },
          { navigate: vi.fn(), clearSession: vi.fn() },
        ),
      ),
    ).toBe('UNKNOWN');
    vi.restoreAllMocks();

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: { not: 'rows' },
            }),
            { status: 200 },
          ),
      ),
    );
    const empty = await submitSessions(
      { portalType: 'sessions', action: 'list', values: { page: 2 } },
      { navigate: vi.fn(), clearSession: vi.fn() },
    );
    expect(empty.ok).toBe(true);
    if (empty.ok) {
      expect(empty.sessions).toEqual([]);
      expect(empty.page).toBe(2);
    }

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: [{ session_id: 's9', user_agent: 'Edge' }],
              meta: { page: 3, has_next: true },
            }),
            { status: 200 },
          ),
      ),
    );
    const paged = await submitSessions(
      { portalType: 'sessions', action: 'list', values: { page: 1 } },
      { navigate: vi.fn(), clearSession: vi.fn() },
    );
    expect(paged.ok).toBe(true);
    if (paged.ok) {
      expect(paged.page).toBe(3);
      expect(paged.hasNext).toBe(true);
    }
  });

  it('revokes the current session and surfaces revoke errors', async () => {
    const navigate = vi.fn();
    const clearSession = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if ((init?.method ?? 'GET') === 'DELETE') {
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
          });
        }
        if (url.includes('/auth/logout')) {
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
          });
        }
        return new Response(JSON.stringify({ success: true, data: {} }), {
          status: 200,
        });
      }),
    );
    const current = await submitSessions(
      { portalType: 'sessions', action: 'revoke', values: { sessionId: 's1' } },
      { navigate, clearSession },
      [{ session_id: 's1', is_current: true }],
    );
    expect(current.ok).toBe(true);
    expect(clearSession).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalled();

    const other = await submitSessions(
      { portalType: 'sessions', action: 'revoke', values: { sessionId: 's2' } },
      { navigate: vi.fn(), clearSession: vi.fn() },
      [{ session_id: 's2', is_current: false }],
    );
    expect(other.ok).toBe(true);

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: { code: 'FORBIDDEN' },
            }),
            { status: 403 },
          ),
      ),
    );
    const forbidden = await submitSessions(
      { portalType: 'sessions', action: 'revoke', values: { sessionId: 's9' } },
      { navigate: vi.fn(), clearSession: vi.fn() },
    );
    expect(failCopy(forbidden)).toBe('FORBIDDEN');

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: false }), { status: 500 }),
      ),
    );
    const unknown = await submitSessions(
      { portalType: 'sessions', action: 'revoke', values: { sessionId: 's9' } },
      { navigate: vi.fn(), clearSession: vi.fn() },
    );
    expect(failCopy(unknown)).toBe('UNKNOWN');
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 500,
      data: null,
    });
    expect(
      failCopy(
        await submitSessions(
          {
            portalType: 'sessions',
            action: 'revoke',
            values: { sessionId: 's9' },
          },
          { navigate: vi.fn(), clearSession: vi.fn() },
        ),
      ),
    ).toBe('UNKNOWN');
    vi.restoreAllMocks();

    expect(
      await submitSessions(pharmacyLogin, {
        navigate: vi.fn(),
        clearSession: vi.fn(),
      }),
    ).toMatchObject({ ok: false });
  });
});

describe('submitForgot and submitReset', () => {
  it('requests a reset without leaking whether the account exists', async () => {
    expect(
      await submitForgot({
        portalType: 'pharmacy',
        action: 'login',
        values: { identifier: 'a@b.c', password: 'x' },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitForgot({
        portalType: 'pharmacy-forgot',
        action: 'request',
        values: { identifier: '' },
      }),
    ).toMatchObject({ ok: false });
    expect(
      await submitForgot({
        portalType: 'pharmacy-forgot',
        action: 'request',
        values: { identifier: 'nope' },
      }),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { requested: true },
    });
    expect(
      await submitForgot({
        portalType: 'pharmacy-forgot',
        action: 'request',
        values: { identifier: 'priya@srirama.in' },
      }),
    ).toMatchObject({ ok: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 429,
      data: null,
      code: 'RATE_LIMITED',
      retryAfterSeconds: 60,
    });
    expect(
      await submitForgot({
        portalType: 'pharmacy-forgot',
        action: 'request',
        values: { identifier: 'priya@srirama.in' },
      }),
    ).toMatchObject({ ok: false, code: 'RATE_LIMITED' });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 429,
      data: null,
      code: 'RATE_LIMITED',
    });
    expect(
      await submitForgot({
        portalType: 'pharmacy-forgot',
        action: 'request',
        values: { identifier: 'priya@srirama.in' },
      }),
    ).toMatchObject({
      ok: false,
      formError: 'Too many attempts. Try again shortly.',
    });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 500,
      data: null,
      code: 'INTERNAL_ERROR',
      message: 'Down',
    });
    expect(
      await submitForgot({
        portalType: 'pharmacy-forgot',
        action: 'request',
        values: { identifier: 'priya@srirama.in' },
      }),
    ).toMatchObject({ ok: false });
    let finish:
      ((value: { ok: true; status: number; data: object }) => void) | undefined;
    vi.spyOn(hostApi, 'request').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = submitForgot({
      portalType: 'pharmacy-forgot',
      action: 'request',
      values: { identifier: 'priya@srirama.in' },
    });
    expect(
      await submitForgot({
        portalType: 'pharmacy-forgot',
        action: 'request',
        values: { identifier: 'priya@srirama.in' },
      }),
    ).toMatchObject({ ok: false });
    finish?.({ ok: true, status: 200, data: { requested: true } });
    await pending;
  });

  it('completes a reset then returns to login', async () => {
    const navigate = vi.fn();
    expect(
      await submitReset(
        {
          portalType: 'pharmacy-forgot',
          action: 'request',
          values: { identifier: 'a@b.c' },
        },
        { navigate },
      ),
    ).toMatchObject({ ok: false });
    expect(
      await submitReset(
        {
          portalType: 'pharmacy-reset',
          action: 'complete',
          values: { password: 'short' } as {
            resetToken: string;
            password: string;
          },
        },
        { navigate },
      ),
    ).toMatchObject({ ok: false });
    expect(
      await submitReset(
        {
          portalType: 'pharmacy-reset',
          action: 'complete',
          values: { resetToken: '', password: 'short' },
        },
        { navigate },
      ),
    ).toMatchObject({ ok: false });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { staff_id: 's1' },
    });
    expect(
      await submitReset(
        {
          portalType: 'pharmacy-reset',
          action: 'complete',
          values: { resetToken: 'tok', password: 'Secret12!' },
        },
        { navigate },
      ),
    ).toMatchObject({ ok: true });
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true });
    vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 404,
      data: null,
      code: 'RESET_INVALID',
      message: 'Reset is invalid or expired',
    });
    expect(
      await submitReset(
        {
          portalType: 'pharmacy-reset',
          action: 'complete',
          values: { resetToken: 'tok', password: 'Secret12!' },
        },
        { navigate },
      ),
    ).toMatchObject({ ok: false, code: 'RESET_INVALID' });
    let finish:
      ((value: { ok: true; status: number; data: object }) => void) | undefined;
    vi.spyOn(hostApi, 'request').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = submitReset(
      {
        portalType: 'pharmacy-reset',
        action: 'complete',
        values: { resetToken: 'tok', password: 'Secret12!' },
      },
      { navigate },
    );
    expect(
      await submitReset(
        {
          portalType: 'pharmacy-reset',
          action: 'complete',
          values: { resetToken: 'tok', password: 'Secret12!' },
        },
        { navigate },
      ),
    ).toMatchObject({ ok: false });
    finish?.({ ok: true, status: 200, data: {} });
    await pending;
  });
});
