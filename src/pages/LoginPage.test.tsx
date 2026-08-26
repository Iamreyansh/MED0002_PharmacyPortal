import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '@/pages/LoginPage';
import { PosLoginPage } from '@/pages/PosLoginPage';
import { SessionProvider } from '@/session/SessionProvider';
import { SESSION_FIXTURES } from '@/session/session';
import { getTokens } from '@/api/token-store';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
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

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <SessionProvider>
        <LoginPage />
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  it('validates empty fields before the network', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    renderLogin();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText('Enter your email or +91 mobile number.')).toBeTruthy();
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
    render(
      <MemoryRouter initialEntries={['/login']}>
        <SessionProvider>
          <LoginPage />
        </SessionProvider>
      </MemoryRouter>,
    );
    await user.type(
      screen.getByLabelText('Email or mobile'),
      'priya@srirama.in',
    );
    await user.type(screen.getByLabelText('Password'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(getTokens().accessToken).toBe('access');
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
    renderLogin();
    await user.type(
      screen.getByLabelText('Email or mobile'),
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
    renderLogin();
    await user.type(
      screen.getByLabelText('Email or mobile'),
      'priya@srirama.in',
    );
    await user.type(screen.getByLabelText('Password'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    const alert = await screen.findByTestId('login-error');
    expect(alert.textContent).toMatch(/Locked/);
    expect(alert.textContent).toMatch(/IST/);
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
    renderLogin();
    await user.type(
      screen.getByLabelText('Email or mobile'),
      'priya@srirama.in',
    );
    await user.type(screen.getByLabelText('Password'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.click(screen.getByRole('button', { name: 'Signing in…' }));
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

  it('tabs identifier then password then submit', () => {
    renderLogin();
    const form = screen.getByTestId('login-page').querySelector('form');
    const controls = form?.querySelectorAll('input, button[type="submit"]');
    expect(controls?.[0]).toHaveAttribute('name', 'identifier');
    expect(controls?.[1]).toHaveAttribute('name', 'password');
    expect(controls?.[2]).toHaveAttribute('type', 'submit');
  });
});

describe('PosLoginPage', () => {
  it('does not submit until the PIN is 4 digits', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(
      <MemoryRouter>
        <SessionProvider>
          <PosLoginPage />
        </SessionProvider>
      </MemoryRouter>,
    );
    await user.type(
      screen.getByLabelText('Pharmacy ID'),
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    );
    await user.type(
      screen.getByLabelText('Staff ID'),
      '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fills PIN from keyboard digits and posts pos-pin', async () => {
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
    render(
      <MemoryRouter>
        <SessionProvider>
          <PosLoginPage />
        </SessionProvider>
      </MemoryRouter>,
    );
    await user.type(
      screen.getByLabelText('Pharmacy ID'),
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    );
    await user.type(
      screen.getByLabelText('Staff ID'),
      '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    );
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => {
      expect(getTokens().tokenScope).toBe('pos');
      expect(getTokens().accessToken).toBe('pos-access');
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
    render(
      <MemoryRouter>
        <SessionProvider>
          <PosLoginPage />
        </SessionProvider>
      </MemoryRouter>,
    );
    await user.type(
      screen.getByLabelText('Pharmacy ID'),
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    );
    await user.type(
      screen.getByLabelText('Staff ID'),
      '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    );
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByTestId('pos-login-error')).toHaveTextContent(
      'PIN does not match',
    );
    expect(screen.getByTestId('pin-display').textContent).toBe('○○○○');
  });
});

describe('authenticated login redirect', () => {
  it('does not show the form when already signed in', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <SessionProvider session={SESSION_FIXTURES['owner-free']}>
          <LoginPage />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('login-page')).toBeNull();
  });
});
