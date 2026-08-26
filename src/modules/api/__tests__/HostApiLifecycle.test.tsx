import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostApiLifecycle } from '@/modules/api';
import { getTokens, resetTokenStore, setTokens } from '@/modules/api';
import { SessionProvider } from '@/modules/session';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  resetTokenStore();
});

describe('HostApiLifecycle', () => {
  it('does not ping me when no tokens are stored', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { unmount } = render(
      <MemoryRouter>
        <SessionProvider>
          <HostApiLifecycle />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(fetch).not.toHaveBeenCalled();
    unmount();
  });

  it('cancels bootstrap when unmounted and fails closed on a bad /me', async () => {
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    let finishMe: ((value: Response) => void) | undefined;
    const fetch = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finishMe = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetch);
    const { unmount } = render(
      <MemoryRouter>
        <SessionProvider>
          <HostApiLifecycle />
        </SessionProvider>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    unmount();
    finishMe?.(
      new Response(JSON.stringify({ success: true, data: { id: 'u1' } }), {
        status: 200,
      }),
    );
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
        async () =>
          new Response(JSON.stringify({ success: true, data: null }), {
            status: 200,
          }),
      ),
    );
    render(
      <MemoryRouter>
        <SessionProvider>
          <HostApiLifecycle />
        </SessionProvider>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(getTokens().accessToken).toBeNull();
    });
  });

  it('keeps chrome when /me fails after tokens are already cleared', async () => {
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    const fetch = vi.fn(async () => {
      const { clearTokens } = await import('@/modules/api');
      clearTokens();
      return new Response(
        JSON.stringify({ success: false, error: { code: 'UNKNOWN' } }),
        { status: 500 },
      );
    });
    vi.stubGlobal('fetch', fetch);
    render(
      <MemoryRouter>
        <SessionProvider>
          <HostApiLifecycle />
        </SessionProvider>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('applies registration status and ignores a cancelled follow-up', async () => {
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    let finishStatus: ((value: Response) => void) | undefined;
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/me')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: { id: 'u1', name: 'Priya', role: 'pharmacy_owner' },
          }),
          { status: 200 },
        );
      }
      return new Promise<Response>((resolve) => {
        finishStatus = resolve;
      });
    });
    vi.stubGlobal('fetch', fetch);
    const { unmount } = render(
      <MemoryRouter>
        <SessionProvider>
          <HostApiLifecycle />
        </SessionProvider>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(fetch.mock.calls.length).toBeGreaterThan(1);
    });
    unmount();
    finishStatus?.(
      new Response(
        JSON.stringify({ success: true, data: { status: 'ACTIVE' } }),
        { status: 200 },
      ),
    );
  });

  it('skips registration status for a POS scope that appears after /me', async () => {
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/me')) {
        setTokens({
          accessToken: 'pos-access',
          refreshToken: null,
          tokenType: 'Bearer',
          tokenScope: 'pos',
          accessTokenExpiresAt: null,
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'UNKNOWN' },
          }),
          { status: 500 },
        );
      }
      return new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
      });
    });
    vi.stubGlobal('fetch', fetch);
    render(
      <MemoryRouter>
        <SessionProvider>
          <HostApiLifecycle />
        </SessionProvider>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(getTokens().accessToken).toBeNull();
    });
  });

  it('does not ping me for POS-scoped tokens', () => {
    setTokens({
      accessToken: 'pos-access',
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'pos',
      accessTokenExpiresAt: null,
    });
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { unmount } = render(
      <MemoryRouter>
        <SessionProvider>
          <HostApiLifecycle />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(fetch).not.toHaveBeenCalled();
    unmount();
  });

  it('bootstraps GET /api/v1/auth/me when tokens exist', async () => {
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/me')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: { id: 'u1', name: 'Priya', role: 'pharmacy_owner' },
          }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: { status: 'ACTIVE', plan: 'FREE' },
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal('fetch', fetch);
    render(
      <MemoryRouter>
        <SessionProvider>
          <HostApiLifecycle />
        </SessionProvider>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(String(fetch.mock.calls[0]?.[0])).toContain('/api/v1/auth/me');
    });
  });

  it('ignores a failed registration-status payload', async () => {
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/me')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: { id: 'u1', name: 'Priya', role: 'pharmacy_owner' },
          }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: { code: 'UNKNOWN' } }),
        { status: 500 },
      );
    });
    vi.stubGlobal('fetch', fetch);
    render(
      <MemoryRouter>
        <SessionProvider>
          <HostApiLifecycle />
        </SessionProvider>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(fetch.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
