import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/shared/test/render';
import { SESSION_FIXTURES } from '@/modules/session';
import { getTokens, resetTokenStore, setTokens } from '@/modules/api';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetTokenStore();
});

const pharmacies = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Sri Rama Medicals',
    role: 'pharmacy_owner',
    isActive: true,
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Rama Pharmacy - Koramangala',
    role: 'pharmacy_staff',
    isActive: true,
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'Closed shop',
    role: 'pharmacy_staff',
    isActive: false,
  },
];

describe('route guards', () => {
  it('redirects anonymous inventory visits to login', () => {
    renderApp('/inventory', SESSION_FIXTURES.unauthenticated);
    expect(screen.getByTestId('login-page')).toBeTruthy();
  });

  it('redirects PENDING_KYC away from rx-quotes', () => {
    renderApp('/rx-quotes', SESSION_FIXTURES['owner-pending-kyc']);
    expect(screen.getByTestId('onboarding-status-page')).toBeTruthy();
  });

  it('blocks suspended pharmacies from marketplace', () => {
    renderApp('/rx-quotes', SESSION_FIXTURES['owner-suspended']);
    expect(screen.getByTestId('suspended-block')).toBeTruthy();
    expect(screen.getByTestId('suspension-banner')).toBeTruthy();
  });

  it('keeps POS scope off inventory', () => {
    renderApp('/inventory', SESSION_FIXTURES['pos-scope']);
    expect(screen.getByTestId('remote-page-pos')).toBeTruthy();
  });

  it('allows anonymous register', () => {
    renderApp('/register', SESSION_FIXTURES.unauthenticated);
    expect(screen.getByTestId('register-page')).toBeTruthy();
  });

  it('allows anonymous email verify', () => {
    renderApp('/register/verify', SESSION_FIXTURES.unauthenticated);
    expect(screen.getByTestId('register-verify-page')).toBeTruthy();
  });

  it('keeps children while a stored session is hydrating and drops unsafe returns', () => {
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    renderApp('/inventory', SESSION_FIXTURES.unauthenticated);
    expect(screen.getByTestId('inventory-list-page')).toBeTruthy();
    cleanup();
    resetTokenStore();
    renderApp('/ok://x', SESSION_FIXTURES.unauthenticated);
    expect(screen.getByTestId('login-page')).toBeTruthy();
  });
});

describe('pharmacy switcher', () => {
  it('is hidden for a single pharmacy and for POS', () => {
    renderApp('/', SESSION_FIXTURES['owner-free']);
    expect(screen.queryByTestId('pharmacy-switcher')).toBeNull();
    cleanup();
    renderApp('/pos', SESSION_FIXTURES['pos-scope'], { pharmacies });
    expect(screen.queryByTestId('pharmacy-switcher')).toBeNull();
  });

  it('posts switch-pharmacy and keeps context on 403', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            success: false,
            error: { code: 'FORBIDDEN', message: 'No' },
          }),
          { status: 403 },
        ),
    );
    vi.stubGlobal('fetch', fetch);
    renderApp('/', SESSION_FIXTURES['owner-free'], { pharmacies });
    await user.click(screen.getByTestId('pharmacy-switcher'));
    expect(screen.queryByRole('option', { name: 'Closed shop' })).toBeNull();
    await user.click(
      screen.getByRole('option', { name: 'Rama Pharmacy - Koramangala' }),
    );
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    const firstUrl = String(
      (fetch.mock.calls as unknown as [unknown][])[0]?.[0],
    );
    expect(firstUrl).toContain('switch-pharmacy');
    expect(screen.getByTestId('pharmacy-name')).toHaveTextContent(
      'Your pharmacy',
    );
    expect(await screen.findByTestId('toast')).toHaveTextContent('FORBIDDEN');
  });

  it('toasts FORBIDDEN when the switch envelope has no code', async () => {
    const user = userEvent.setup();
    const { hostApi } = await import('@/modules/api');
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 403,
      data: null,
    });
    renderApp('/', SESSION_FIXTURES['owner-free'], { pharmacies });
    await user.click(screen.getByTestId('pharmacy-switcher'));
    await user.click(
      screen.getByRole('option', { name: 'Rama Pharmacy - Koramangala' }),
    );
    expect(await screen.findByTestId('toast')).toHaveTextContent('FORBIDDEN');
  });

  it('applies a successful pharmacy switch', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: {
                access_token: 'switched',
                refresh_token: 'r2',
                token_type: 'Bearer',
                role_in_pharmacy: 'owner',
                active_pharmacy: {
                  id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
                  name: 'Rama Pharmacy - Koramangala',
                  subscription_plan: 'FREE',
                },
              },
            }),
            { status: 200 },
          ),
      ),
    );
    renderApp('/', SESSION_FIXTURES['owner-free'], { pharmacies });
    await user.click(screen.getByTestId('pharmacy-switcher'));
    await user.click(
      screen.getByRole('option', { name: 'Rama Pharmacy - Koramangala' }),
    );
    await waitFor(() => {
      expect(screen.getByTestId('pharmacy-name')).toHaveTextContent(
        'Rama Pharmacy - Koramangala',
      );
    });
  });
});

describe('session menu logout', () => {
  it('clears tokens even when logout fails', async () => {
    const user = userEvent.setup();
    const { setTokens } = await import('@/modules/api');
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    renderApp('/', SESSION_FIXTURES['owner-free']);
    await user.click(screen.getByTestId('session-menu'));
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    await waitFor(() => {
      expect(getTokens().accessToken).toBeNull();
      expect(screen.getByTestId('login-page')).toBeTruthy();
    });
  });
});
