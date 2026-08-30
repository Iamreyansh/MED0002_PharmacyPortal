import { describe, expect, it, vi } from 'vitest';
import { performLogout } from '@/modules/session';
import { hostApi, setTokens, getTokens } from '@/modules/api';
import * as deviceToken from '@/modules/session/lib/device-token';

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
    const urls = (fetch.mock.calls as unknown as [unknown][]).map((call) =>
      String(call[0]),
    );
    expect(urls.some((url) => url.includes('device-token'))).toBe(true);
    expect(urls.some((url) => url.includes('logout-all'))).toBe(true);
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    await expect(performLogout()).resolves.toBe('/login');
    expect(
      (fetch.mock.calls as unknown as [unknown][])
        .map((call) => String(call[0]))
        .some((url) => url.includes('/auth/logout')),
    ).toBe(true);
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
    vi.spyOn(hostApi, 'request').mockRejectedValue(new Error('offline'));
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    await expect(performLogout()).resolves.toBe('/login');
    setTokens({
      accessToken: 'a',
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    await expect(performLogout()).resolves.toBe('/login');
    vi.spyOn(deviceToken, 'unregisterDeviceToken').mockRejectedValueOnce(
      new Error('offline'),
    );
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
