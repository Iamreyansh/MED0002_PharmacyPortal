import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HostApiLifecycle } from '@/api/HostApiLifecycle';
import { setTokens } from '@/api/token-store';

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
        <HostApiLifecycle />
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
      async (_url: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ success: true, data: { id: 'u1' } }), {
          status: 200,
        }),
    );
    vi.stubGlobal('fetch', fetch);
    render(
      <MemoryRouter>
        <HostApiLifecycle />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(String(fetch.mock.calls[0]?.[0])).toContain('/api/v1/auth/me');
    });
  });
});
