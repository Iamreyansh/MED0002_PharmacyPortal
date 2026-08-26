import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EMPTY_TOKENS,
  PORTAL_TOKEN_STORAGE_KEY,
  applyTokenPair,
  clearTokens,
  getTokens,
  hasStoredSession,
  resetTokenStore,
  setTokens,
} from '@/api/token-store';

afterEach(() => {
  resetTokenStore();
  vi.unstubAllGlobals();
});

describe('token store', () => {
  it('round-trips tokens through sessionStorage', () => {
    expect(hasStoredSession()).toBe(false);
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: 1000,
    });
    expect(hasStoredSession()).toBe(true);
    resetTokenStore();
    sessionStorage.setItem(
      PORTAL_TOKEN_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'a',
        refreshToken: 'r',
        tokenType: 'Bearer',
        tokenScope: 'full',
        accessTokenExpiresAt: 1000,
      }),
    );
    expect(getTokens()).toEqual({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: 1000,
    });
  });

  it('ignores corrupt or incomplete stored snapshots', () => {
    sessionStorage.setItem(PORTAL_TOKEN_STORAGE_KEY, '{');
    expect(getTokens()).toEqual(EMPTY_TOKENS);
    resetTokenStore();
    sessionStorage.setItem(
      PORTAL_TOKEN_STORAGE_KEY,
      JSON.stringify({ tokenType: 'Bearer' }),
    );
    expect(getTokens()).toEqual(EMPTY_TOKENS);
    resetTokenStore();
    sessionStorage.setItem(
      PORTAL_TOKEN_STORAGE_KEY,
      JSON.stringify({ tokenScope: 'full' }),
    );
    expect(getTokens()).toEqual(EMPTY_TOKENS);
    resetTokenStore();
    sessionStorage.setItem(
      PORTAL_TOKEN_STORAGE_KEY,
      JSON.stringify({
        tokenType: 'Bearer',
        tokenScope: 'pos',
        accessToken: 1,
        refreshToken: 2,
      }),
    );
    expect(getTokens()).toEqual({
      accessToken: null,
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'pos',
      accessTokenExpiresAt: null,
    });
  });

  it('applies a Core token pair and clears on logout', () => {
    expect(applyTokenPair({ access_token: '', refresh_token: 'r' }, 0)).toBe(
      false,
    );
    expect(
      applyTokenPair(
        {
          access_token: 'next-access',
          refresh_token: 'next-refresh',
          token_type: 'Bearer',
          access_token_expires_in: 900,
        },
        1000,
      ),
    ).toBe(true);
    expect(getTokens().accessToken).toBe('next-access');
    expect(getTokens().accessTokenExpiresAt).toBe(901000);
    expect(applyTokenPair({ access_token: 'only-access' }, 2000)).toBe(true);
    expect(getTokens().refreshToken).toBe('next-refresh');
    expect(getTokens().tokenType).toBe('Bearer');
    expect(getTokens().accessTokenExpiresAt).toBeNull();
    clearTokens();
    expect(hasStoredSession()).toBe(false);
    setTokens({
      accessToken: null,
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    expect(sessionStorage.getItem(PORTAL_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('survives storage failures', () => {
    const boom = () => {
      throw new Error('blocked');
    };
    vi.stubGlobal('sessionStorage', {
      getItem: boom,
      setItem: boom,
      removeItem: boom,
    });
    resetTokenStore();
    expect(getTokens()).toEqual(EMPTY_TOKENS);
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    expect(getTokens().accessToken).toBe('a');
    clearTokens();
    expect(getTokens().accessToken).toBeNull();
  });
});
