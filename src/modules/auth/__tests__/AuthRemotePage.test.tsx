import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AuthFeatureData } from '@medmate/auth-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { AuthRemotePage, useAuthFeature } from '@/modules/auth';
import {
  SessionProvider,
  SESSION_FIXTURES,
  resetSessionSnapshot,
} from '@/modules/session';
import { getTokens, resetTokenStore } from '@/modules/api';
import { resetPharmacySubmit } from '@/modules/auth/lib/submit-pharmacy';
import { resetPosSubmit } from '@/modules/auth/lib/submit-pos';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  resetTokenStore();
  resetSessionSnapshot();
  resetPharmacySubmit();
  resetPosSubmit();
  sessionStorage.removeItem('medmate.portal.pos-last');
});

const loginData = {
  access_token: 'access',
  refresh_token: 'refresh',
  token_type: 'Bearer',
  access_token_expires_in: 900,
  active_pharmacy: {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Sri Rama Medicals',
    subscription_plan: 'FREE',
  },
  staff: {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    name: 'Priya Sharma',
    role: 'pharmacy_owner',
  },
  pharmacies: [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'Sri Rama Medicals',
      role: 'pharmacy_owner',
      is_active: true,
    },
  ],
};

function pharmacyStub(): RemoteImporter {
  return async () => ({
    default: function PharmacyStub(props: Record<string, unknown>) {
      const data = props.data as {
        feature: AuthFeatureData;
        capabilities?: { navigate?: (path: string) => void };
      };
      const [error, setError] = useState<string | null>(null);
      const [fields, setFields] = useState<Record<string, string>>({});
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void data.feature
              .onSubmit({
                portalType: 'pharmacy',
                action: 'login',
                values: {
                  identifier: String(form.get('identifier') ?? ''),
                  password: String(form.get('password') ?? ''),
                },
              })
              .then((result) => {
                if (!result.ok) {
                  setError(result.formError ?? null);
                  setFields(result.fieldErrors ?? {});
                }
              });
          }}
        >
          {error ? (
            <p data-testid="login-error" role="alert">
              {error}
            </p>
          ) : null}
          {fields.identifier ? <p>{fields.identifier}</p> : null}
          {fields.password ? <p>{fields.password}</p> : null}
          <label>
            Email or mobile
            <input name="identifier" />
          </label>
          <label>
            Password
            <input name="password" type="password" />
          </label>
          <button type="submit">Sign in</button>
          {data.feature.links?.posLogin ? (
            <button
              type="button"
              onClick={() =>
                data.capabilities?.navigate?.(data.feature.links!.posLogin!)
              }
            >
              Counter PIN sign-in
            </button>
          ) : null}
        </form>
      );
    },
  });
}

function posStub(): RemoteImporter {
  return async () => ({
    default: function PosStub(props: Record<string, unknown>) {
      const data = props.data as { feature: AuthFeatureData };
      const [error, setError] = useState<string | null>(null);
      const [pin, setPin] = useState(
        data.feature.initialValues?.pharmacyId ? '' : '',
      );
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void data.feature
              .onSubmit({
                portalType: 'pos',
                action: 'login',
                values: {
                  pharmacyId: String(form.get('pharmacyId') ?? ''),
                  staffId: String(form.get('staffId') ?? ''),
                  pin,
                },
              })
              .then((result) => {
                if (!result.ok) {
                  setError(result.formError ?? null);
                  if (
                    result.code === 'INVALID_PIN' ||
                    result.fieldErrors?.pin
                  ) {
                    setPin('');
                  }
                }
              });
          }}
        >
          {error ? (
            <p data-testid="pos-login-error" role="alert">
              {error}
            </p>
          ) : null}
          <label>
            Pharmacy ID
            <input
              name="pharmacyId"
              defaultValue={data.feature.initialValues?.pharmacyId}
            />
          </label>
          <label>
            Staff ID
            <input
              name="staffId"
              defaultValue={data.feature.initialValues?.staffId}
            />
          </label>
          <p data-testid="pin-display">
            {pin.replace(/./g, '•').padEnd(4, '○')}
          </p>
          <button
            type="button"
            onClick={() => setPin((c) => `${c}1`.slice(0, 4))}
          >
            1
          </button>
          <button type="submit">Sign in</button>
        </form>
      );
    },
  });
}

function renderAuth(
  portalType: 'pharmacy' | 'pos' | 'sessions',
  loadRemote?: RemoteImporter,
  session = SESSION_FIXTURES.unauthenticated,
  path?: string,
) {
  const initialPath =
    path ??
    (portalType === 'pos'
      ? '/pos-login'
      : portalType === 'sessions'
        ? '/sessions'
        : '/login');
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SessionProvider session={session}>
        <Routes>
          <Route
            path="/login"
            element={
              <AuthRemotePage
                key="pharmacy"
                portalType="pharmacy"
                loadRemote={loadRemote}
              />
            }
          />
          <Route
            path="/pos-login"
            element={
              <AuthRemotePage
                key="pos"
                portalType="pos"
                loadRemote={loadRemote}
              />
            }
          />
          <Route
            path="/sessions"
            element={
              <AuthRemotePage
                key="sessions"
                portalType="sessions"
                loadRemote={loadRemote}
              />
            }
          />
          <Route path="/" element={<div data-testid="portal-home" />} />
          <Route path="/pos" element={<div data-testid="pos-page" />} />
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe('AuthRemotePage', () => {
  it('keeps login-page when the remote is missing', async () => {
    renderAuth('pharmacy');
    expect(screen.getByTestId('login-page')).toBeTruthy();
    expect(screen.getByTestId('login-page').className).toContain(
      'auth-page--wide',
    );
    expect(await screen.findByTestId('remote-missing')).toBeTruthy();
  });

  it('uses a centered narrow stage for POS login', async () => {
    renderAuth('pos');
    expect(screen.getByTestId('pos-login-page').className).toBe('auth-page');
    expect(await screen.findByTestId('remote-missing')).toBeTruthy();
  });

  it('keeps sessions on the console page stage', () => {
    renderAuth('sessions');
    expect(screen.getByTestId('sessions-page').className).toBe('page');
  });

  it('navigates from pharmacy login to POS login via the host envelope', async () => {
    const user = userEvent.setup();
    renderAuth('pharmacy', pharmacyStub());
    await user.click(
      await screen.findByRole('button', { name: 'Counter PIN sign-in' }),
    );
    expect(await screen.findByTestId('pos-login-page')).toBeTruthy();
  });

  it('uses a configured remote URL when present', async () => {
    vi.stubEnv('VITE_REMOTE_AUTH_URL', 'https://example.test/mf-manifest.json');
    renderAuth('pharmacy');
    expect(await screen.findByTestId('remote-error')).toBeTruthy();
  });

  it('validates empty pharmacy fields before the network', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    renderAuth('pharmacy', pharmacyStub());
    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(fetch).not.toHaveBeenCalled();
    expect(
      screen.getByText('Enter your email or +91 mobile number.'),
    ).toBeTruthy();
    expect(screen.getByText('Enter your password.')).toBeTruthy();
  });

  it('stores tokens and lands on home after a happy envelope', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: true, data: loginData }), {
            status: 200,
          }),
      ),
    );
    renderAuth('pharmacy', pharmacyStub());
    await user.type(
      await screen.findByLabelText('Email or mobile'),
      'priya@srirama.in',
    );
    await user.type(screen.getByLabelText('Password'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(getTokens().accessToken).toBe('access');
      expect(screen.getByTestId('portal-home')).toBeTruthy();
    });
  });

  it('shows Core INVALID_CREDENTIALS without naming a field', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid credentials',
              },
            }),
            { status: 401 },
          ),
      ),
    );
    renderAuth('pharmacy', pharmacyStub());
    await user.type(
      await screen.findByLabelText('Email or mobile'),
      'priya@srirama.in',
    );
    await user.type(screen.getByLabelText('Password'), 'bad');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      'Invalid credentials',
    );
    expect(screen.getByTestId('login-error').textContent).not.toMatch(
      /password|email/i,
    );
  });

  it('shows ACCOUNT_LOCKED unlock_at in IST', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: {
                code: 'ACCOUNT_LOCKED',
                message: 'Locked',
                details: { unlock_at: '2026-08-26T18:00:00.000Z' },
              },
            }),
            { status: 403 },
          ),
      ),
    );
    renderAuth('pharmacy', pharmacyStub());
    await user.type(
      await screen.findByLabelText('Email or mobile'),
      'priya@srirama.in',
    );
    await user.type(screen.getByLabelText('Password'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    const alert = await screen.findByTestId('login-error');
    expect(alert.textContent).toMatch(/Locked/);
    expect(alert.textContent).toMatch(/IST/);
  });

  it('rejects a bad identifier and shows 429 retry copy', async () => {
    const user = userEvent.setup();
    renderAuth('pharmacy', pharmacyStub());
    await user.type(
      await screen.findByLabelText('Email or mobile'),
      'not-an-id',
    );
    await user.type(screen.getByLabelText('Password'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Use an email or +91 mobile number.')).toBeTruthy();
    cleanup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: { code: 'RATE_LIMITED', message: null },
            }),
            { status: 429, headers: { 'Retry-After': '12' } },
          ),
      ),
    );
    renderAuth('pharmacy', pharmacyStub());
    await user.type(
      await screen.findByLabelText('Email or mobile'),
      'priya@srirama.in',
    );
    await user.type(screen.getByLabelText('Password'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      /Too many attempts/,
    );
    cleanup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: { code: 'RATE_LIMITED', message: 'Slow down' },
            }),
            { status: 429 },
          ),
      ),
    );
    renderAuth('pharmacy', pharmacyStub());
    await user.type(
      await screen.findByLabelText('Email or mobile'),
      'priya@srirama.in',
    );
    await user.type(screen.getByLabelText('Password'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      'Slow down',
    );
    cleanup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: { code: 'RATE_LIMITED', retry_after_seconds: 12 },
            }),
            { status: 429 },
          ),
      ),
    );
    renderAuth('pharmacy', pharmacyStub());
    await user.type(
      await screen.findByLabelText('Email or mobile'),
      'priya@srirama.in',
    );
    await user.type(screen.getByLabelText('Password'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      'Retry in 12s',
    );
  });

  it('does not send a second POST while in-flight', async () => {
    const user = userEvent.setup();
    let finish: ((value: Response) => void) | undefined;
    const fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetch);
    renderAuth('pharmacy', pharmacyStub());
    await user.type(
      await screen.findByLabelText('Email or mobile'),
      'priya@srirama.in',
    );
    await user.type(screen.getByLabelText('Password'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    screen
      .getByRole('button', { name: 'Sign in' })
      .closest('form')
      ?.requestSubmit();
    expect(fetch).toHaveBeenCalledTimes(1);
    finish?.(
      new Response(JSON.stringify({ success: true, data: loginData }), {
        status: 200,
      }),
    );
    await waitFor(() => {
      expect(getTokens().accessToken).toBe('access');
    });
  });

  it('redirects authenticated pharmacy and POS sessions', () => {
    renderAuth('pharmacy', undefined, SESSION_FIXTURES['owner-free']);
    expect(screen.getByTestId('portal-home')).toBeTruthy();
    cleanup();
    renderAuth('pharmacy', undefined, SESSION_FIXTURES['pos-scope']);
    expect(screen.getByTestId('pos-page')).toBeTruthy();
    cleanup();
    renderAuth('pos', undefined, SESSION_FIXTURES['pos-scope'], '/pos-login');
    expect(screen.getByTestId('pos-page')).toBeTruthy();
    cleanup();
    renderAuth('pos', undefined, SESSION_FIXTURES['owner-free'], '/pos-login');
    expect(screen.getByTestId('pos-page')).toBeTruthy();
  });

  it('fills a POS PIN and posts pos-pin', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: {
                access_token: 'pos-access',
                token_type: 'Bearer',
                token_scope: 'pos',
                access_token_expires_in: 14400,
                staff: { id: 's1', name: 'Kavya', role: 'cashier' },
                pharmacy: {
                  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                  name: 'Sri Rama Medicals',
                },
              },
            }),
            { status: 200 },
          ),
      ),
    );
    renderAuth(
      'pos',
      posStub(),
      SESSION_FIXTURES.unauthenticated,
      '/pos-login',
    );
    await user.type(
      await screen.findByLabelText('Pharmacy ID'),
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    );
    await user.type(
      screen.getByLabelText('Staff ID'),
      '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    );
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(getTokens().tokenScope).toBe('pos');
      expect(getTokens().accessToken).toBe('pos-access');
      expect(screen.getByTestId('pos-page')).toBeTruthy();
    });
  });

  it('clears the keypad on INVALID_PIN', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: false,
              error: { code: 'INVALID_PIN', message: 'PIN does not match' },
            }),
            { status: 401 },
          ),
      ),
    );
    renderAuth(
      'pos',
      posStub(),
      SESSION_FIXTURES.unauthenticated,
      '/pos-login',
    );
    await user.type(
      await screen.findByLabelText('Pharmacy ID'),
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    );
    await user.type(
      screen.getByLabelText('Staff ID'),
      '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    );
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByTestId('pos-login-error')).toHaveTextContent(
      'PIN does not match',
    );
    expect(screen.getByTestId('pin-display').textContent).toBe('○○○○');
  });

  it('rejects missing POS ids and a short PIN', async () => {
    const user = userEvent.setup();
    renderAuth(
      'pos',
      posStub(),
      SESSION_FIXTURES.unauthenticated,
      '/pos-login',
    );
    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(
      screen.getByText('Pharmacy and staff IDs are required.'),
    ).toBeTruthy();
    await user.type(
      screen.getByLabelText('Pharmacy ID'),
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    );
    await user.type(
      screen.getByLabelText('Staff ID'),
      '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    );
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter a 4-digit PIN.')).toBeTruthy();
  });

  it('prefills POS ids from host storage', async () => {
    sessionStorage.setItem(
      'medmate.portal.pos-last',
      JSON.stringify({
        pharmacyId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        staffId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      }),
    );
    renderAuth(
      'pos',
      posStub(),
      SESSION_FIXTURES.unauthenticated,
      '/pos-login',
    );
    expect(await screen.findByLabelText('Pharmacy ID')).toHaveValue(
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    );
  });
});

describe('useAuthFeature', () => {
  it('rejects portal types this host does not implement', async () => {
    function Probe() {
      const feature = useAuthFeature('admin');
      const [msg, setMsg] = useState('');
      useEffect(() => {
        void feature
          .onSubmit({
            portalType: 'admin',
            action: 'login',
            values: { email: 'ops@nammamedmate.com', password: 'Secret123!' },
          })
          .then((result) => {
            setMsg(result.ok ? 'ok' : (result.formError ?? ''));
          });
      }, [feature]);
      return <p data-testid="unsupported">{msg}</p>;
    }
    render(
      <MemoryRouter>
        <SessionProvider>
          <Probe />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('unsupported')).toHaveTextContent(
      'This portal does not support that sign-in method.',
    );
  });
});
