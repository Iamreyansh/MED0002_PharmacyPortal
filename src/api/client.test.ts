import { afterEach, describe, expect, it, vi } from 'vitest';
import { PORTAL_ERROR } from '@/api/codes';
import {
  ACCESS_REFRESH_SKEW_MS,
  createApiClient,
  hostApi,
  setSessionDeathHandler,
} from '@/api/client';
import { subscribeTelemetry } from '@/api/telemetry';
import { getTokens, setTokens } from '@/api/token-store';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function okData(data: unknown, status = 200): Response {
  return jsonResponse({ success: true, data }, status);
}

function errData(
  code: string,
  status: number,
  extra: Record<string, unknown> = {},
): Response {
  return jsonResponse({ success: false, error: { code, ...extra } }, status);
}

function header(init: RequestInit | undefined, name: string): string | null {
  return new Headers(init?.headers).get(name);
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('createApiClient facade', () => {
  it('parses success and does not rewrite snake_case POST bodies', async () => {
    const fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(_url)).toBe('http://core.test/api/v1/items');
      expect(init?.body).toBe(JSON.stringify({ refresh_token: 'keep_me' }));
      expect(String(_url)).not.toContain('pharmacy_id');
      return okData({ x: 1 });
    });
    const client = createApiClient({
      fetch,
      baseUrl: 'http://core.test',
    });
    const result = await client.request<{ x: number }>({
      path: '/api/v1/items',
      method: 'POST',
      body: { refresh_token: 'keep_me' },
    });
    expect(result.ok).toBe(true);
    expect(result.data.x).toBe(1);
  });

  it('rejects paths that are not /api/v1/ and omits Authorization without a token', async () => {
    const fetch = vi.fn();
    const client = createApiClient({ fetch, baseUrl: 'http://core.test' });
    const result = await client.request({ path: '/noop' });
    expect(result.ok).toBe(false);
    expect(result.code).toBe(PORTAL_ERROR.INVALID_API_PATH);
    expect(fetch).not.toHaveBeenCalled();

    fetch.mockResolvedValueOnce(okData({ ok: true }));
    await client.request({ path: '/api/v1/public' });
    expect(header(fetch.mock.calls[0]?.[1], 'Authorization')).toBeNull();
  });

  it('maps 403 PLAN_FEATURE_LOCKED and emits api_error with code only', async () => {
    const events: Array<[string, Record<string, unknown> | undefined]> = [];
    const stop = subscribeTelemetry((event, properties) => {
      events.push([event, properties]);
    });
    const client = createApiClient({
      fetch: async () => errData('PLAN_FEATURE_LOCKED', 403),
      baseUrl: 'http://core.test',
    });
    const result = await client.request({ path: '/api/v1/billing' });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('PLAN_FEATURE_LOCKED');
    expect(events).toEqual([['api_error', { code: 'PLAN_FEATURE_LOCKED' }]]);
    stop();
  });

  it('passes MODULE_NOT_IN_PLAN and POS_TOKEN_RESTRICTED through', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(errData('MODULE_NOT_IN_PLAN', 403))
      .mockResolvedValueOnce(errData('POS_TOKEN_RESTRICTED', 403));
    const client = createApiClient({ fetch, baseUrl: 'http://core.test' });
    expect((await client.request({ path: '/api/v1/analytics' })).code).toBe(
      'MODULE_NOT_IN_PLAN',
    );
    expect((await client.request({ path: '/api/v1/settings' })).code).toBe(
      'POS_TOKEN_RESTRICTED',
    );
  });

  it('returns UPSTREAM_INVALID_JSON and NETWORK_ERROR', async () => {
    const client = createApiClient({
      fetch: async () => new Response('<nope>', { status: 500 }),
      baseUrl: 'http://core.test',
    });
    expect((await client.request({ path: '/api/v1/x' })).code).toBe(
      PORTAL_ERROR.UPSTREAM_INVALID_JSON,
    );

    const failing = createApiClient({
      fetch: async () => {
        throw new Error('offline');
      },
      baseUrl: 'http://core.test',
      sleep: async () => undefined,
    });
    const network = await failing.request({ path: '/api/v1/x' });
    expect(network.code).toBe(PORTAL_ERROR.NETWORK_ERROR);
    expect(network.message).toMatch(/Retry/);
  });

  it('returns binary blobs and still parses JSON errors for binary requests', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(blob, {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        }),
      )
      .mockResolvedValueOnce(errData('FORBIDDEN', 403));
    const client = createApiClient({ fetch, baseUrl: 'http://core.test' });
    const file = await client.request<Blob>({
      path: '/api/v1/invoices/1.pdf',
      binary: true,
    });
    expect(file.ok).toBe(true);
    expect(file.data).toEqual(
      expect.objectContaining({ type: 'application/pdf' }),
    );
    expect((file.data as Blob).size).toBeGreaterThan(0);

    const denied = await client.request({
      path: '/api/v1/invoices/1.pdf',
      binary: true,
    });
    expect(denied.code).toBe('FORBIDDEN');
  });

  it('sends FormData and Blob bodies without forcing JSON Content-Type', async () => {
    const fetch = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      okData({}),
    );
    const client = createApiClient({ fetch, baseUrl: 'http://core.test' });
    const form = new FormData();
    form.set('file', 'x');
    await client.request({
      path: '/api/v1/kyc',
      method: 'POST',
      body: form,
      idempotencyKey: 'kyc-1',
    });
    expect(fetch.mock.calls[0]?.[1]?.body).toBe(form);
    expect(header(fetch.mock.calls[0]?.[1], 'Content-Type')).toBeNull();
    expect(header(fetch.mock.calls[0]?.[1], 'Idempotency-Key')).toBe('kyc-1');

    await client.request({
      path: '/api/v1/kyc',
      method: 'PUT',
      body: new Blob(['x']),
    });
    expect(fetch.mock.calls[1]?.[1]?.body).toBeInstanceOf(Blob);
  });

  it('does not send a GET body and uses VITE_API_BASE_URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://env.test/');
    const fetch = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      okData({}),
    );
    const client = createApiClient({ fetch });
    await client.request({
      path: '/api/v1/search',
      method: 'GET',
      body: { q: 'x' },
    });
    expect(String(fetch.mock.calls[0]?.[0])).toBe(
      'http://env.test/api/v1/search',
    );
    expect(fetch.mock.calls[0]?.[1]?.body).toBeUndefined();
  });

  it('times out hung requests as NETWORK_ERROR', async () => {
    const client = createApiClient({
      timeoutMs: 20,
      baseUrl: 'http://core.test',
      fetch: (_url, init) =>
        new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    });
    const result = await client.request({ path: '/api/v1/slow' });
    expect(result.code).toBe(PORTAL_ERROR.NETWORK_ERROR);
  });
});

describe('auth attach and refresh', () => {
  it('attaches Bearer and single-flights refresh for concurrent 401s', async () => {
    setTokens({
      accessToken: 'old',
      refreshToken: 'rt',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: Date.now() + 60_000,
    });
    let refreshCalls = 0;
    const fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path.endsWith('/api/v1/auth/refresh')) {
        refreshCalls += 1;
        expect(JSON.parse(String(init?.body))).toEqual({ refresh_token: 'rt' });
        expect(header(init, 'Authorization')).toBeNull();
        return okData({
          access_token: 'new',
          refresh_token: 'rt2',
          token_type: 'Bearer',
          access_token_expires_in: 900,
        });
      }
      if (header(init, 'Authorization') === 'Bearer old') {
        return errData('UNAUTHORIZED', 401);
      }
      return okData({ ok: true });
    });
    const death = vi.fn();
    const client = createApiClient({
      fetch,
      baseUrl: 'http://core.test',
      onSessionDeath: death,
    });
    const [a, b] = await Promise.all([
      client.request({ path: '/api/v1/a' }),
      client.request({ path: '/api/v1/b' }),
    ]);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(refreshCalls).toBe(1);
    expect(getTokens().accessToken).toBe('new');
    expect(death).not.toHaveBeenCalled();
  });

  it('clears the session and routes to /login when refresh fails', async () => {
    setTokens({
      accessToken: 'old',
      refreshToken: 'rt',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    const death = vi.fn();
    const client = createApiClient({
      fetch: async (url) => {
        if (String(url).endsWith('/api/v1/auth/refresh')) {
          return errData('REFRESH_TOKEN_INVALID', 401);
        }
        return errData('UNAUTHORIZED', 401);
      },
      baseUrl: 'http://core.test',
      onSessionDeath: death,
    });
    const result = await client.request({ path: '/api/v1/me' });
    expect(result.status).toBe(401);
    expect(getTokens().refreshToken).toBeNull();
    expect(death).toHaveBeenCalledWith('/login');
  });

  it('routes POS scope session death to /pos-login', async () => {
    setTokens({
      accessToken: 'old',
      refreshToken: 'rt',
      tokenType: 'Bearer',
      tokenScope: 'pos',
      accessTokenExpiresAt: null,
    });
    const death = vi.fn();
    const client = createApiClient({
      fetch: async () => errData('UNAUTHORIZED', 401),
      baseUrl: 'http://core.test',
      onSessionDeath: death,
    });
    await client.request({ path: '/api/v1/pharmacy/pos/cart' });
    expect(death).toHaveBeenCalledWith('/pos-login');
  });

  it('does not refresh-loop on public login 401', async () => {
    setTokens({
      accessToken: 'old',
      refreshToken: 'rt',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    const fetch = vi.fn(async () => errData('INVALID_CREDENTIALS', 401));
    const client = createApiClient({ fetch, baseUrl: 'http://core.test' });
    await client.request({
      path: '/api/v1/auth/pharmacy/login',
      method: 'POST',
      body: { identifier: 'a', password: 'b' },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('skips refresh when there is no session', async () => {
    const fetch = vi.fn(async () => errData('UNAUTHORIZED', 401));
    const client = createApiClient({ fetch, baseUrl: 'http://core.test' });
    await client.request({ path: '/api/v1/auth/me' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('proactively refreshes once before expiry without double-refresh', async () => {
    const now = 1_000_000;
    setTokens({
      accessToken: 'old',
      refreshToken: 'rt',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: now + ACCESS_REFRESH_SKEW_MS - 1,
    });
    let refreshCalls = 0;
    const fetch = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/api/v1/auth/refresh')) {
        refreshCalls += 1;
        return okData({
          access_token: 'new',
          refresh_token: 'rt2',
          token_type: 'Bearer',
          access_token_expires_in: 900,
        });
      }
      return okData({ ok: true });
    });
    const client = createApiClient({
      fetch,
      now: () => now,
      baseUrl: 'http://core.test',
    });
    await Promise.all([
      client.request({ path: '/api/v1/a' }),
      client.request({ path: '/api/v1/b' }),
    ]);
    expect(refreshCalls).toBe(1);
  });

  it('does not proactively refresh public auth or tokens without expiry', async () => {
    setTokens({
      accessToken: 'old',
      refreshToken: 'rt',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    const fetch = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      okData({}),
    );
    const client = createApiClient({
      fetch,
      now: () => Date.now(),
      baseUrl: 'http://core.test',
    });
    await client.request({
      path: '/api/v1/auth/pharmacy/login',
      method: 'POST',
      body: {},
    });
    expect(String(fetch.mock.calls[0]?.[0])).toContain('/login');
  });

  it('treats a refresh success without access_token as session death', async () => {
    setTokens({
      accessToken: 'old',
      refreshToken: 'rt',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: Date.now() + 1000,
    });
    const death = vi.fn();
    const client = createApiClient({
      fetch: async (url) => {
        if (String(url).endsWith('/api/v1/auth/refresh')) {
          return okData('not-an-object');
        }
        return errData('UNAUTHORIZED', 401);
      },
      now: () => Date.now() + ACCESS_REFRESH_SKEW_MS,
      baseUrl: 'http://core.test',
      onSessionDeath: death,
    });
    const result = await client.request({ path: '/api/v1/a' });
    expect(result.code).toBe('UNAUTHORIZED');
    expect(death).toHaveBeenCalledWith('/login');
  });

  it('does not throw when refresh fails without a session-death handler', async () => {
    setTokens({
      accessToken: 'old',
      refreshToken: 'rt',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    const client = createApiClient({
      fetch: async () => errData('UNAUTHORIZED', 401),
      baseUrl: 'http://core.test',
    });
    await expect(client.request({ path: '/api/v1/a' })).resolves.toMatchObject({
      status: 401,
    });
  });

  it('skips proactive refresh when access is still valid', async () => {
    const now = 1_000_000;
    setTokens({
      accessToken: 'old',
      refreshToken: 'rt',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: now + ACCESS_REFRESH_SKEW_MS + 10_000,
    });
    const fetch = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      okData({ ok: true }),
    );
    const client = createApiClient({
      fetch,
      now: () => now,
      baseUrl: 'http://core.test',
    });
    await client.request({ path: '/api/v1/a' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0]?.[0])).toContain('/api/v1/a');
  });

  it('treats refresh 200 with an empty object as session death', async () => {
    setTokens({
      accessToken: 'old',
      refreshToken: 'rt',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    const death = vi.fn();
    const client = createApiClient({
      fetch: async (url) => {
        if (String(url).endsWith('/api/v1/auth/refresh')) {
          return okData({});
        }
        return errData('UNAUTHORIZED', 401);
      },
      baseUrl: 'http://core.test',
      onSessionDeath: death,
    });
    await client.request({ path: '/api/v1/a' });
    expect(death).toHaveBeenCalledWith('/login');
  });

  it('accepts a null JSON body', async () => {
    const fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.body).toBeUndefined();
      return okData({});
    });
    const client = createApiClient({ fetch, baseUrl: 'http://core.test' });
    await client.request({
      path: '/api/v1/a',
      method: 'DELETE',
      body: null,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('uses the session death handler when deps omit onSessionDeath', async () => {
    const death = vi.fn();
    setSessionDeathHandler(death);
    setTokens({
      accessToken: 'old',
      refreshToken: 'rt',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    const client = createApiClient({
      fetch: async () => errData('UNAUTHORIZED', 401),
      baseUrl: 'http://core.test',
    });
    await client.request({ path: '/api/v1/a' });
    expect(death).toHaveBeenCalledWith('/login');
  });
});

describe('retries and idempotency', () => {
  it('retries GET after retry_after_seconds and reuses an idempotency key', async () => {
    const sleep = vi.fn(async () => undefined);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        errData('RATE_LIMITED', 429, { retry_after_seconds: 2 }),
      )
      .mockResolvedValueOnce(okData({ x: 1 }))
      .mockResolvedValue(okData({ paid: true }));
    const client = createApiClient({
      fetch,
      sleep,
      baseUrl: 'http://core.test',
    });
    const first = await client.request({ path: '/api/v1/ledger' });
    expect(first.ok).toBe(true);
    expect(sleep).toHaveBeenCalledWith(2000);

    const key = 'same-intent';
    await client.request({
      path: '/api/v1/pharmacy/pos/checkout',
      method: 'POST',
      body: { cart_id: '1' },
      idempotencyKey: key,
    });
    await client.request({
      path: '/api/v1/pharmacy/pos/checkout',
      method: 'POST',
      body: { cart_id: '1' },
      idempotencyKey: key,
    });
    expect(header(fetch.mock.calls[2]?.[1], 'Idempotency-Key')).toBe(key);
    expect(header(fetch.mock.calls[3]?.[1], 'Idempotency-Key')).toBe(key);
    const nextKey = client.createIdempotencyKey?.() ?? 'x';
    expect(nextKey).not.toBe(key);
  });

  it('does not automatically retry POST 500 without a key', async () => {
    const fetch = vi.fn(async () => errData('INTERNAL', 500));
    const client = createApiClient({ fetch, baseUrl: 'http://core.test' });
    const result = await client.request({
      path: '/api/v1/pharmacy/pos/checkout',
      method: 'POST',
      body: { cart_id: '1' },
    });
    expect(result.status).toBe(500);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries GET 503 then recovers a following 401', async () => {
    setTokens({
      accessToken: 'old',
      refreshToken: 'rt',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(errData('UNAVAILABLE', 503))
      .mockResolvedValueOnce(errData('UNAUTHORIZED', 401))
      .mockResolvedValueOnce(
        okData({
          access_token: 'new',
          refresh_token: 'rt2',
          token_type: 'Bearer',
          access_token_expires_in: 900,
        }),
      )
      .mockResolvedValueOnce(okData({ ok: true }));
    const client = createApiClient({
      fetch,
      sleep: async () => undefined,
      baseUrl: 'http://core.test',
    });
    const result = await client.request({ path: '/api/v1/stock' });
    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('uses default sleep for a zero retry_after GET 503', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(errData('UNAVAILABLE', 503))
      .mockResolvedValueOnce(okData({ ok: true }));
    const client = createApiClient({ fetch, baseUrl: 'http://core.test' });
    await expect(
      client.request({ path: '/api/v1/stock' }),
    ).resolves.toMatchObject({ ok: true });
  });

  it('advances the default sleep for retry_after_seconds', async () => {
    vi.useFakeTimers();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        errData('RATE_LIMITED', 429, { retry_after_seconds: 1 }),
      )
      .mockResolvedValueOnce(okData({ ok: true }));
    const client = createApiClient({ fetch, baseUrl: 'http://core.test' });
    const pending = client.request({ path: '/api/v1/stock' });
    await vi.advanceTimersByTimeAsync(1000);
    await expect(pending).resolves.toMatchObject({ ok: true });
  });
});

describe('hostApi singleton', () => {
  it('uses global fetch when no fetch dep is provided', async () => {
    const fetch = vi.fn(async () => okData({ x: 1 }));
    vi.stubGlobal('fetch', fetch);
    const result = await hostApi.request({ path: '/api/v1/ping' });
    expect(result.ok).toBe(true);
    hostApi.reset();
  });
});
