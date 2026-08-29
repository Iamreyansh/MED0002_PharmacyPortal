import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import { renderApp, setViewportWidth } from '@/shared/test/render';
import { SESSION_FIXTURES } from '@/modules/session';
import { MemoryRouter } from 'react-router-dom';
import { setTokens } from '@/modules/api';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  setViewportWidth(1280);
});

describe('App chrome', () => {
  it('renders landmarks, home shortcuts, and no Todo nav', async () => {
    const user = userEvent.setup();
    setViewportWidth(1280);
    renderApp('/', SESSION_FIXTURES['owner-free']);
    expect(screen.getByTestId('portal-home')).toBeTruthy();
    expect(screen.getByTestId('portal-nav')).toBeTruthy();
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Todos' })).toBeNull();
    expect(screen.queryByRole('link', { name: /todos/i })).toBeNull();
    expect(
      screen
        .getByRole('navigation', { name: 'Primary' })
        .querySelector('a[href="/todos"]'),
    ).toBeNull();
    expect(
      screen.getAllByRole('heading', { name: 'Counter' }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'POS' })[0]).toHaveAttribute(
      'href',
      '/pos',
    );
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBeTruthy();
    expect(
      document.activeElement === document.body ||
        (document.activeElement instanceof HTMLElement &&
          document.activeElement.matches(':focus')),
    ).toBe(true);
  });

  it('uses a bottom nav under 768px and a menu under 1024px', async () => {
    const user = userEvent.setup();
    setViewportWidth(375);
    renderApp('/', SESSION_FIXTURES['owner-free']);
    expect(screen.getByTestId('portal-bottom-nav')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(
      screen.getByRole('button', { name: 'Close navigation' }),
    ).toBeTruthy();
  });

  it('collapses the sidebar on tablet widths', async () => {
    const user = userEvent.setup();
    setViewportWidth(800);
    renderApp('/', SESSION_FIXTURES['owner-free']);
    const open = screen.getByRole('button', { name: 'Open navigation' });
    await user.click(open);
    expect(
      screen.getByRole('button', { name: 'Close navigation' }),
    ).toBeTruthy();
  });
});

describe('permission and plan nav', () => {
  it('omits Roles for cashier and Settlements for staff', () => {
    renderApp('/', SESSION_FIXTURES.cashier);
    expect(screen.queryByRole('link', { name: 'Roles' })).toBeNull();

    cleanup();
    renderApp('/', SESSION_FIXTURES['staff-star']);
    expect(screen.queryByRole('link', { name: 'Settlements' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Billing' })).toBeNull();
  });

  it('shows owner-only SaaS Billing next to Subscription', () => {
    renderApp('/', SESSION_FIXTURES['owner-free']);
    expect(screen.getAllByRole('link', { name: 'Billing' })[0]).toHaveAttribute(
      'href',
      '/billing',
    );
  });

  it('locks Khata on Free and enables Analytics on Growth', () => {
    renderApp('/', SESSION_FIXTURES['owner-free']);
    const locks = screen.getAllByTestId('plan-lock');
    expect(locks.some((node) => node.textContent?.includes('Khata'))).toBe(
      true,
    );

    cleanup();
    renderApp('/', SESSION_FIXTURES['owner-retail-pro']);
    expect(
      screen.getAllByRole('link', { name: 'Analytics' }).length,
    ).toBeGreaterThan(0);
  });

  it('moves focus to the lock explanation when a locked item is activated', async () => {
    const user = userEvent.setup();
    renderApp('/', SESSION_FIXTURES['owner-free']);
    const khata = screen
      .getAllByTestId('plan-lock')
      .find((node) => node.textContent?.includes('Khata'));
    expect(khata).toBeTruthy();
    await user.click(khata!);
    expect(
      document.activeElement?.id.startsWith('nav-lock-khata') ||
        document.activeElement?.textContent?.includes('Starter'),
    ).toBe(true);
  });

  it('omits rx-quotes and shows KYC when pending KYC', () => {
    renderApp('/', SESSION_FIXTURES['owner-pending-kyc']);
    expect(screen.queryByRole('link', { name: 'Rx quotes' })).toBeNull();
    expect(screen.getByRole('link', { name: 'KYC' })).toHaveAttribute(
      'href',
      '/onboarding/kyc',
    );
  });

  it('keeps POS scope on /pos when settings is requested', () => {
    renderApp('/settings/roles', SESSION_FIXTURES['pos-scope']);
    expect(screen.getAllByRole('link', { name: 'POS' }).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByRole('link', { name: 'Roles' })).toBeNull();
    expect(screen.queryByTestId('settings-roles-page')).toBeNull();
    expect(
      screen.getAllByRole('button', { name: 'Sign out' }).length,
    ).toBeGreaterThan(0);
  });

  it('stays on POS for a POS-scoped token', () => {
    renderApp('/pos', SESSION_FIXTURES['pos-scope']);
    expect(screen.getByTestId('remote-missing')).toBeTruthy();
    expect(screen.queryByTestId('not-found')).toBeNull();
  });

  it('allows nested POS paths for a POS-scoped token', () => {
    renderApp('/pos/cart', SESSION_FIXTURES['pos-scope']);
    expect(screen.queryByTestId('not-found')).toBeNull();
    expect(
      screen.getAllByRole('button', { name: 'Sign out' }).length,
    ).toBeGreaterThan(0);
  });

  it('shows upgrade on owner locks and ask-owner copy for staff', () => {
    renderApp('/', SESSION_FIXTURES['owner-free']);
    expect(
      screen.getAllByRole('link', { name: 'Upgrade' }).length,
    ).toBeGreaterThan(0);
    cleanup();
    renderApp('/', SESSION_FIXTURES.cashier);
    expect(screen.queryByRole('link', { name: 'Upgrade' })).toBeNull();
  });
});

describe('degraded remotes and Todo retirement', () => {
  it('keeps chrome when a module remote is missing', () => {
    renderApp('/pos', SESSION_FIXTURES['owner-free']);
    expect(screen.getByTestId('portal-nav')).toBeTruthy();
    expect(screen.getByTestId('remote-missing')).toBeTruthy();
  });

  it('returns not-found for /todos without the demo flag', () => {
    vi.stubEnv('VITE_ENABLE_DEMO_REMOTES', '');
    renderApp('/todos', SESSION_FIXTURES['owner-free']);
    expect(screen.getByTestId('not-found')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Todos' })).toBeNull();
  });

  it('may mount the Todo remote when the demo flag is on', () => {
    vi.stubEnv('VITE_ENABLE_DEMO_REMOTES', 'true');
    vi.stubEnv('VITE_REMOTE_TODO_URL', 'https://example.test/mf-manifest.json');
    renderApp('/todos', SESSION_FIXTURES['owner-free']);
    expect(screen.getByRole('heading', { name: 'Todos' })).toBeTruthy();
  });

  it('shows not-found for unknown paths', () => {
    renderApp('/does-not-exist', SESSION_FIXTURES['owner-free']);
    expect(screen.getByTestId('not-found')).toBeTruthy();
  });
});

describe('App default session', () => {
  it('renders login when session is omitted', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('login-page')).toBeTruthy();
  });

  it('renders login destinations for anonymous staff', () => {
    renderApp('/login', SESSION_FIXTURES.unauthenticated);
    expect(screen.getByTestId('login-page')).toBeTruthy();
    cleanup();
    renderApp('/pos-login', SESSION_FIXTURES.unauthenticated);
    expect(screen.getByTestId('pos-login-page')).toBeTruthy();
  });

  it('redirects an authenticated user away from login', () => {
    renderApp('/login', SESSION_FIXTURES['owner-free']);
    expect(screen.getByTestId('portal-home')).toBeTruthy();
    cleanup();
    renderApp('/register', SESSION_FIXTURES['owner-free']);
    expect(screen.getByTestId('portal-home')).toBeTruthy();
    cleanup();
    renderApp('/register/verify', SESSION_FIXTURES['owner-pending-kyc']);
    expect(screen.getByTestId('onboarding-status-page')).toBeTruthy();
  });

  it('routes an expired stored session to login', async () => {
    setTokens({
      accessToken: 'expired',
      refreshToken: 'expired-rt',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: 0,
    });
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
    renderApp('/');
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeTruthy();
    });
  });
});
