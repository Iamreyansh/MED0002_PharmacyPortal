import { describe, expect, it, vi } from 'vitest';
import { performLogout } from '@/modules/session';
import { hostApi, setTokens, getTokens } from '@/modules/api';

describe('performLogout', () => {
  it('posts logout-all, logout, and pos destination', async () => {
    const fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetch);
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    await expect(performLogout({ all: true })).resolves.toBe('/login');
    expect(
      String((fetch.mock.calls as unknown as [unknown][])[0]?.[0]),
    ).toContain('logout-all');
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    await expect(performLogout()).resolves.toBe('/login');
    expect(
      String((fetch.mock.calls as unknown as [unknown][])[1]?.[0]),
    ).toContain('/auth/logout');
    setTokens({
      accessToken: 'p',
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'pos',
      accessTokenExpiresAt: null,
    });
    await expect(performLogout()).resolves.toBe('/pos-login');
    expect(getTokens().accessToken).toBeNull();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    await expect(performLogout()).resolves.toBe('/login');
    vi.spyOn(hostApi, 'request').mockRejectedValueOnce(new Error('offline'));
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    await expect(performLogout()).resolves.toBe('/login');
  });
});
