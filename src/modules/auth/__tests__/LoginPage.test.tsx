import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '@/modules/auth';
import { PosLoginPage } from '@/modules/auth';
import {
  SessionProvider,
  SESSION_FIXTURES,
  resetSessionSnapshot,
} from '@/modules/session';
import { getTokens, resetTokenStore } from '@/modules/api';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  resetTokenStore();
  resetSessionSnapshot();
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
    const form = screen.getByTestId('login-page').querySelector('form');
    form?.requestSubmit();
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

  it('rejects a bad identifier and shows 429 retry copy', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText('Email or mobile'), 'not-an-id');
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
    renderLogin();
    await user.type(
      screen.getByLabelText('Email or mobile'),
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
    renderLogin();
    await user.type(
      screen.getByLabelText('Email or mobile'),
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
    renderLogin();
    await user.type(
      screen.getByLabelText('Email or mobile'),
      'priya@srirama.in',
    );
    await user.type(screen.getByLabelText('Password'), 'Secret123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      'Retry in 12s',
    );
  });

  it('sends a POS session to the counter', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <SessionProvider session={SESSION_FIXTURES['pos-scope']}>
          <LoginPage />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('login-page')).toBeNull();
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

  it('covers keypad, keyboard, invalid ids, and stored last ids', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('medmate.portal.pos-last', '{');
    render(
      <MemoryRouter>
        <SessionProvider>
          <PosLoginPage />
        </SessionProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: '3' }));
    await user.click(screen.getByRole('button', { name: '4' }));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(
      screen.getByText('Pharmacy and staff IDs are required.'),
    ).toBeTruthy();
    const form = screen.getByTestId('pos-login-page').querySelector('form');
    form?.requestSubmit();
    cleanup();
    sessionStorage.setItem(
      'medmate.portal.pos-last',
      JSON.stringify({ pharmacyId: 1, staffId: 2 }),
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
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: 'Backspace' }));
    const spacer = document.querySelector('.pin-keypad__spacer');
    (spacer as HTMLButtonElement | null)?.click();
    const pinForm = screen.getByTestId('pos-login-page').querySelector('form');
    pinForm?.requestSubmit();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '9' }));
    const pinInput = screen.getByLabelText('Pharmacy ID');
    pinInput.focus();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }));
    cleanup();
    render(
      <MemoryRouter>
        <SessionProvider session={SESSION_FIXTURES['pos-scope']}>
          <PosLoginPage />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('pos-login-page')).toBeNull();
    cleanup();
    render(
      <MemoryRouter>
        <SessionProvider session={SESSION_FIXTURES['owner-free']}>
          <PosLoginPage />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(screen.queryByTestId('pos-login-page')).toBeNull();
  });

  it('ignores a second submit while in-flight and storage write failures', async () => {
    const user = userEvent.setup();
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
    screen.getByTestId('pos-login-page').querySelector('form')?.requestSubmit();
    finish?.(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            access_token: 'pos-access',
            token_type: 'Bearer',
            token_scope: 'pos',
            staff: { id: 's1', name: 'Kavya', role: 'cashier' },
            pharmacy: {
              id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
              name: 'Sri Rama Medicals',
            },
          },
        }),
        { status: 200 },
      ),
    );
    await waitFor(() => {
      expect(getTokens().tokenScope).toBe('pos');
    });
    cleanup();
    resetTokenStore();
    resetSessionSnapshot();
    const setItem = vi.fn(() => {
      throw new Error('blocked');
    });
    vi.stubGlobal('sessionStorage', {
      getItem: () => null,
      setItem,
      removeItem: () => undefined,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: {
                access_token: 'pos-access-2',
                token_type: 'Bearer',
                token_scope: 'pos',
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
      expect(getTokens().accessToken).toBe('pos-access-2');
    });
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
