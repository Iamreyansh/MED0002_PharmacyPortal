import {
  cleanup,
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp, setViewportWidth } from '@/shared/test/render';
import { SESSION_FIXTURES } from '@/modules/session';
import { ToastProvider, useToast } from '@/modules/shell';
import { getTokens, resetTokenStore, setTokens } from '@/modules/api';
import { applyStorefrontStatus } from '@/modules/settings/store/storefront-status';
import { NAV_CATALOG } from '@/modules/navigation';
import { hasNavGlyph, navGlyph } from '@/modules/shell/lib/icons';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  resetTokenStore();
  setViewportWidth(1280);
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
];

describe('nav glyphs', () => {
  it('maps a glyph for every catalog item and falls back', () => {
    for (const item of NAV_CATALOG) {
      expect(hasNavGlyph(item.id)).toBe(true);
      const { container } = render(navGlyph(item.id));
      expect(container.querySelector('svg')).toBeTruthy();
    }
    expect(hasNavGlyph('missing-id')).toBe(false);
    const { container } = render(navGlyph('missing-id'));
    expect(container.querySelector('svg')).toBeTruthy();
  });
});

describe('mobile nav drawer', () => {
  it('closes on Escape, scrim, and navigation', async () => {
    const user = userEvent.setup();
    setViewportWidth(375);
    renderApp('/', SESSION_FIXTURES['owner-free']);
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(screen.getByTestId('nav-scrim')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(
      screen.getByRole('button', { name: 'Close navigation' }),
    ).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(
      screen.getByRole('button', { name: 'Open navigation' }),
    ).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    await user.click(screen.getByTestId('nav-scrim'));
    expect(
      screen.getByRole('button', { name: 'Open navigation' }),
    ).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    await user.click(screen.getAllByRole('link', { name: 'POS' })[0]!);
    expect(
      screen.getByRole('button', { name: 'Open navigation' }),
    ).toBeTruthy();
  });
});

describe('POS sidebar logout', () => {
  it('signs the counter out from the sidebar', async () => {
    const user = userEvent.setup();
    setTokens({
      accessToken: 'pos-access',
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'pos',
      accessTokenExpiresAt: null,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: true }), { status: 200 }),
      ),
    );
    renderApp('/pos', SESSION_FIXTURES['pos-scope']);
    await user.click(screen.getAllByRole('button', { name: 'Sign out' })[0]!);
    await waitFor(() => {
      expect(getTokens().accessToken).toBeNull();
      expect(screen.getByTestId('pos-login-page')).toBeTruthy();
    });
  });
});

describe('session menu', () => {
  it('signs out of all devices and ignores a second click while pending', async () => {
    const user = userEvent.setup();
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    let finish: ((value: Response) => void) | undefined;
    const fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetch);
    renderApp('/', SESSION_FIXTURES['owner-free']);
    await user.click(screen.getByTestId('session-menu'));
    await user.click(
      screen.getByRole('menuitem', { name: 'Sign out all devices' }),
    );
    await user.click(
      screen.getByRole('menuitem', { name: 'Sign out all devices' }),
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    finish?.(new Response(JSON.stringify({ success: true }), { status: 200 }));
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeTruthy();
    });
  });

  it('hides sign-out-all on POS and ignores a second pending click', async () => {
    const user = userEvent.setup();
    renderApp('/pos', SESSION_FIXTURES['pos-scope']);
    await user.click(screen.getByTestId('session-menu'));
    expect(
      screen.queryByRole('menuitem', { name: 'Sign out all devices' }),
    ).toBeNull();
    cleanup();
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>(() => {
            /* hang */
          }),
      ),
    );
    renderApp('/', SESSION_FIXTURES['owner-free']);
    await user.click(screen.getByTestId('session-menu'));
    const item = screen.getByRole('menuitem', { name: 'Sign out' });
    fireEvent.click(item);
    await waitFor(() => {
      expect(item).toBeDisabled();
    });
    fireEvent.click(item);
  });
});

describe('pharmacy switcher', () => {
  it('closes when the current pharmacy is selected', async () => {
    const user = userEvent.setup();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    renderApp('/', SESSION_FIXTURES['owner-free'], {
      pharmacies: [
        {
          id: SESSION_FIXTURES['owner-free'].pharmacyId ?? 'fixture-pharmacy',
          name: SESSION_FIXTURES['owner-free'].pharmacyName,
          role: 'pharmacy_owner',
          isActive: true,
        },
        pharmacies[1]!,
      ],
    });
    await user.click(screen.getByTestId('pharmacy-switcher'));
    await user.click(screen.getByRole('option', { name: 'Your pharmacy' }));
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

describe('toast', () => {
  it('shows a toast, dismisses it, and throws outside the provider', async () => {
    const user = userEvent.setup();
    const pending: Array<() => void> = [];
    const nativeSetTimeout = window.setTimeout.bind(window);
    vi.spyOn(window, 'setTimeout').mockImplementation(((
      fn: TimerHandler,
      ms?: number,
      ...args: unknown[]
    ) => {
      if (ms === 6000 && typeof fn === 'function') {
        pending.push(() => fn(...args));
        return 1;
      }
      return nativeSetTimeout(fn, ms, ...args);
    }) as typeof setTimeout);
    function Probe() {
      const { showToast } = useToast();
      return (
        <button type="button" onClick={() => showToast('Hello')}>
          ping
        </button>
      );
    }
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'ping' }));
    expect(screen.getByTestId('toast')).toHaveTextContent('Hello');
    act(() => {
      pending.forEach((fn) => fn());
    });
    expect(screen.queryByTestId('toast')).toBeNull();
    expect(() => render(<Probe />)).toThrow(
      'useToast must be used within ToastProvider',
    );
  });

  it('surfaces POS_TOKEN_RESTRICTED from telemetry', async () => {
    const { track } = await import('@/modules/api');
    render(
      <ToastProvider>
        <p>host</p>
      </ToastProvider>,
    );
    track('api_error', { code: 'POS_TOKEN_RESTRICTED' });
    expect(await screen.findByTestId('toast')).toHaveTextContent(
      'POS_TOKEN_RESTRICTED',
    );
  });
});

describe('storefront chip', () => {
  it('shows Online then Offline from host status', () => {
    renderApp('/', SESSION_FIXTURES['owner-free']);
    expect(screen.queryByTestId('storefront-chip')).toBeNull();
    cleanup();
    applyStorefrontStatus({ is_online: true });
    renderApp('/', SESSION_FIXTURES['owner-free']);
    expect(screen.getByTestId('storefront-chip')).toHaveTextContent('Online');
    cleanup();
    applyStorefrontStatus({ is_online: false });
    renderApp('/', SESSION_FIXTURES['owner-free']);
    expect(screen.getByTestId('storefront-chip')).toHaveTextContent('Offline');
  });
});
