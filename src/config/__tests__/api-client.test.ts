import { describe, expect, it } from 'vitest';
import { isPublicAuthPath, isValidApiPath } from '@/config/api-client';
import { readApiBaseUrl, readEnv, readPublicEnv } from '@/config/env';
import { isDemoRemotesEnabled } from '@/config/features';
import {
  DEFAULT_MFE_DIST_ROOT,
  MFE_LOCAL_PREFIX,
  isLocalMfeDistDisabled,
  localManifestPath,
  localManifestUrl,
  resolveMfeDistRoot,
} from '@/config/mfe-local-dist';
import {
  PRODUCT_REMOTE_REGISTRY,
  listProductRegistry,
  listRemoteRegistry,
} from '@/config/remotes';
import {
  PORTAL_TOKEN_STORAGE_KEY,
  SESSION_FIXTURE_ENV_KEY,
} from '@/config/session';
import {
  TELEMETRY_EVENT_ALLOWLIST,
  TELEMETRY_SECRET_KEY,
} from '@/config/telemetry';

describe('API path helpers', () => {
  it('accepts only /api/v1/ prefixed paths', () => {
    expect(isValidApiPath('/api/v1/auth/me')).toBe(true);
    expect(isValidApiPath('/api/v1')).toBe(false);
    expect(isValidApiPath('/v1/auth/me')).toBe(false);
  });

  it('recognises public auth paths including query strings', () => {
    expect(isPublicAuthPath('/api/v1/auth/refresh')).toBe(true);
    expect(isPublicAuthPath('/api/v1/auth/pharmacy/login')).toBe(true);
    expect(isPublicAuthPath('/api/v1/auth/pharmacy/pos-pin')).toBe(true);
    expect(isPublicAuthPath('/api/v1/pharmacy/register/verify-email')).toBe(
      true,
    );
    expect(isPublicAuthPath('/api/v1/auth/pharmacy/login?next=/')).toBe(true);
    expect(isPublicAuthPath('/api/v1/auth/me')).toBe(false);
  });
});

describe('env helpers', () => {
  it('reads public env values and api base url', () => {
    const env = {
      VITE_API_BASE_URL: 'https://api.example.com/',
      VITE_REMOTE_TODO_URL: '',
    };
    expect(readEnv(env)).toBe(env);
    expect(readPublicEnv('VITE_API_BASE_URL', env)).toBe(
      'https://api.example.com/',
    );
    expect(readPublicEnv('VITE_REMOTE_TODO_URL', env)).toBeUndefined();
    expect(readApiBaseUrl(env)).toBe('https://api.example.com');
    expect(readApiBaseUrl({})).toBe('');
    expect(readEnv()).toBeDefined();
    expect(typeof readApiBaseUrl()).toBe('string');
    expect(readPublicEnv('VITE_SESSION_FIXTURE')).toBeUndefined();
  });
});

describe('features and remotes', () => {
  it('reads the demo remotes flag', () => {
    expect(isDemoRemotesEnabled({})).toBe(false);
    expect(isDemoRemotesEnabled({ VITE_ENABLE_DEMO_REMOTES: 'true' })).toBe(
      true,
    );
  });

  it('lists product remotes without demo Todo', () => {
    expect(listProductRegistry()).toEqual(
      Object.values(PRODUCT_REMOTE_REGISTRY),
    );
    expect(listRemoteRegistry()).toEqual(listProductRegistry());
    expect(listProductRegistry().some((remote) => remote.name === 'todo')).toBe(
      false,
    );
  });
});

describe('local MFE dist helpers', () => {
  it('resolves dist root, manifest URLs, and the disable flag', () => {
    expect(resolveMfeDistRoot({})).toBe(DEFAULT_MFE_DIST_ROOT);
    expect(resolveMfeDistRoot({ VITE_MFE_DIST_ROOT: '/tmp/dist/' })).toBe(
      '/tmp/dist',
    );
    expect(localManifestPath('todo')).toBe(
      `${MFE_LOCAL_PREFIX}/todo/mf-manifest.json`,
    );
    expect(localManifestUrl('todo', 'http://localhost:5173/')).toBe(
      'http://localhost:5173/__mfe/todo/mf-manifest.json',
    );
    expect(isLocalMfeDistDisabled({})).toBe(false);
    expect(
      isLocalMfeDistDisabled({ VITE_DISABLE_LOCAL_MFE_DIST: 'true' }),
    ).toBe(true);
  });
});

describe('session and telemetry constants', () => {
  it('exposes storage key and secret deny-list', () => {
    expect(PORTAL_TOKEN_STORAGE_KEY).toBe('medmate.portal.tokens');
    expect(SESSION_FIXTURE_ENV_KEY).toBe('VITE_SESSION_FIXTURE');
    expect(TELEMETRY_EVENT_ALLOWLIST).toContain('api_error');
    expect(TELEMETRY_SECRET_KEY.test('refresh_token')).toBe(true);
    expect(TELEMETRY_SECRET_KEY.test('status')).toBe(false);
  });
});
