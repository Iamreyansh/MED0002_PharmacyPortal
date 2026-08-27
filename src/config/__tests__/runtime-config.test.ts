import { afterEach, describe, expect, it } from 'vitest';
import { readApiBaseUrl, readRemoteLookupEnv } from '@/config/env';
import { resolveRemoteUrl } from '@/config/remotes';
import {
  applyRuntimeConfig,
  parseRuntimeConfig,
  resetRuntimeConfig,
} from '@/config/runtime-config';

afterEach(() => {
  resetRuntimeConfig();
});

describe('runtime config', () => {
  it('parses empty and valid public values', () => {
    expect(parseRuntimeConfig({})).toEqual({
      apiBaseUrl: '',
      mfeDomainSuffix: '',
    });
    expect(
      parseRuntimeConfig({
        apiBaseUrl: 'https://core.api.nammamedmate.com/',
        mfeDomainSuffix: 'mfe.nammamedmate.com',
      }),
    ).toEqual({
      apiBaseUrl: 'https://core.api.nammamedmate.com',
      mfeDomainSuffix: 'mfe.nammamedmate.com',
    });
  });

  it('rejects secrets, unknown keys, and non-https origins', () => {
    expect(() => parseRuntimeConfig(null)).toThrow(/JSON object/);
    expect(() => parseRuntimeConfig([])).toThrow(/JSON object/);
    expect(() => parseRuntimeConfig({ accessToken: 'x' })).toThrow(
      /rejected key/,
    );
    expect(() => parseRuntimeConfig({ extra: 'x' })).toThrow(/rejected key/);
    expect(() => parseRuntimeConfig({ apiBaseUrl: 1 })).toThrow(/string/);
    expect(() =>
      parseRuntimeConfig({ apiBaseUrl: 'http://core.example.com' }),
    ).toThrow(/https origin/);
    expect(() =>
      parseRuntimeConfig({ apiBaseUrl: 'https://core.example.com/v1?x=1' }),
    ).toThrow(/https origin/);
    expect(() =>
      parseRuntimeConfig({
        apiBaseUrl: 'https://attacker.example.com',
      }),
    ).toThrow(/allowlisted Core origin/);
    expect(() => parseRuntimeConfig({ mfeDomainSuffix: 1 })).toThrow(/string/);
    expect(() =>
      parseRuntimeConfig({ mfeDomainSuffix: 'https://evil.test' }),
    ).toThrow(/hostname suffix/);
  });

  it('prefers runtime values over VITE_* for API and remotes', () => {
    expect(
      readApiBaseUrl({ VITE_API_BASE_URL: 'https://vite.example.com/' }),
    ).toBe('https://vite.example.com');
    applyRuntimeConfig({
      apiBaseUrl: 'https://core.api.staging.nammamedmate.com',
      mfeDomainSuffix: 'staging.mfe.nammamedmate.com',
    });
    expect(
      readApiBaseUrl({ VITE_API_BASE_URL: 'https://vite.example.com/' }),
    ).toBe('https://core.api.staging.nammamedmate.com');
    expect(
      readRemoteLookupEnv({ VITE_MFE_DOMAIN_SUFFIX: 'mfe.nammamedmate.com' })
        .VITE_MFE_DOMAIN_SUFFIX,
    ).toBe('staging.mfe.nammamedmate.com');
    expect(resolveRemoteUrl('auth')).toBe(
      'https://auth.staging.mfe.nammamedmate.com/mf-manifest.json',
    );
  });

  it('keeps explicit remote URLs and empty runtime suffixes', () => {
    applyRuntimeConfig({ apiBaseUrl: '', mfeDomainSuffix: '' });
    expect(
      resolveRemoteUrl('auth', {
        VITE_REMOTE_AUTH_URL: 'https://example.test/mf-manifest.json',
      }),
    ).toBe('https://example.test/mf-manifest.json');
    expect(readRemoteLookupEnv({}).VITE_MFE_DOMAIN_SUFFIX).toBeUndefined();
    expect(resolveRemoteUrl('auth', {})).toBeUndefined();
  });
});
