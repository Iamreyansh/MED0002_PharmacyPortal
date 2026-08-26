import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostApiLifecycle } from '@/api/HostApiLifecycle';
import { setTokens } from '@/api/token-store';
import { SessionProvider } from '@/session/SessionProvider';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
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
    const fetch = vi.fn(
      async (input: RequestInfo | URL) => {
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
      },
    );
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
});
