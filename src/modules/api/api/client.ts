import type {
  HostApi,
  HostApiRequest,
  HostApiResponse,
} from '@medmate/contracts';
import {
  ACCESS_REFRESH_SKEW_MS,
  PORTAL_ERROR,
  REFRESH_PATH,
  REQUEST_TIMEOUT_MS,
  isPublicAuthPath,
  isValidApiPath,
} from '@/config/api-client';
import { readApiBaseUrl } from '@/config/env';
import { parseCoreEnvelope } from '@/modules/api/api/core-envelope';
import { buildRequestHeaders } from '@/modules/api/api/headers';
import { createIdempotencyKey } from '@/modules/api/lib/idempotency';
import { track } from '@/modules/api/lib/telemetry';
import {
  applyTokenPair,
  clearTokens,
  getTokens,
  type TokenSnapshot,
} from '@/modules/api/store/token-store';
import { clearSessionSnapshot } from '@/modules/session/store/snapshot';

export {
  ACCESS_REFRESH_SKEW_MS,
  REFRESH_PATH,
  REQUEST_TIMEOUT_MS,
} from '@/config/api-client';

export type SessionDeathPath = '/login' | '/pos-login';

export type ApiClientDeps = {
  fetch?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
  baseUrl?: string;
  track?: typeof track;
  onSessionDeath?: (path: SessionDeathPath) => void;
};

export type ApiClient = Omit<HostApi, 'request'> & {
  request: <T = unknown>(
    input: HostApiRequest,
    opts?: { skipAuth?: boolean },
  ) => Promise<HostApiResponse<T>>;
  reset: () => void;
};

let sessionDeathHandler: ((path: SessionDeathPath) => void) | null = null;

export function setSessionDeathHandler(
  handler: ((path: SessionDeathPath) => void) | null,
): void {
  sessionDeathHandler = handler;
}

function defaultSleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readBaseUrl(): string {
  return readApiBaseUrl();
}

function fail<T>(
  status: number,
  code: string,
  message: string,
): HostApiResponse<T> {
  return {
    ok: false,
    status,
    data: null as T,
    code,
    message,
  };
}

function encodeBody(body: unknown): {
  payload: BodyInit | undefined;
  jsonBody: boolean;
} {
  if (body === undefined || body === null) {
    return { payload: undefined, jsonBody: false };
  }
  if (body instanceof FormData) {
    return { payload: body, jsonBody: false };
  }
  if (body instanceof Blob) {
    return { payload: body, jsonBody: false };
  }
  return { payload: JSON.stringify(body), jsonBody: true };
}

function isGet(method: string): boolean {
  return method === 'GET';
}

function isTransient(method: string, result: HostApiResponse): boolean {
  if (!isGet(method)) {
    return false;
  }
  if (result.code === PORTAL_ERROR.NETWORK_ERROR) {
    return true;
  }
  return result.status === 429 || result.status === 503;
}

function retryWaitMs(result: HostApiResponse): number {
  const seconds = result.retryAfterSeconds ?? 0;
  return seconds > 0 ? seconds * 1000 : 0;
}

function isUnauthorized(result: HostApiResponse): boolean {
  return result.status === 401;
}

function shouldProactiveRefresh(tokens: TokenSnapshot, now: number): boolean {
  if (!tokens.refreshToken || tokens.accessTokenExpiresAt == null) {
    return false;
  }
  return tokens.accessTokenExpiresAt - now <= ACCESS_REFRESH_SKEW_MS;
}

function emitApiError(emit: typeof track, result: HostApiResponse): void {
  if (result.ok) {
    return;
  }
  emit('api_error', { code: result.code as string });
}

function resolveUrl(path: string, baseUrl: string): string {
  return `${baseUrl}${path}`;
}

export function createApiClient(deps: ApiClientDeps = {}): ApiClient {
  let inFlightRefresh: Promise<boolean> | null = null;

  const doFetch = (input: RequestInfo | URL, init?: RequestInit) =>
    (
      deps.fetch ??
      ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args))
    )(input, init);
  const now = () => (deps.now ?? Date.now)();
  const sleep = (ms: number) => (deps.sleep ?? defaultSleep)(ms);
  const timeoutMs = deps.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const emit = deps.track ?? track;

  const notifyDeath = (path: SessionDeathPath) => {
    (deps.onSessionDeath ?? sessionDeathHandler)?.(path);
  };

  const die = () => {
    const scope = getTokens().tokenScope;
    clearTokens();
    clearSessionSnapshot();
    notifyDeath(scope === 'pos' ? '/pos-login' : '/login');
  };

  async function executeOnce<T>(
    input: HostApiRequest,
    opts: { skipAuth?: boolean } = {},
  ): Promise<HostApiResponse<T>> {
    const method = input.method ?? 'GET';
    const baseUrl = deps.baseUrl ?? readBaseUrl();
    const { payload, jsonBody } = encodeBody(input.body);
    const tokens = getTokens();
    const headers = buildRequestHeaders({
      accessToken: tokens.accessToken,
      idempotencyKey: input.idempotencyKey,
      extra: input.headers,
      jsonBody: jsonBody && method !== 'GET',
      skipAuth: opts.skipAuth === true,
    });

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    let result: HostApiResponse<T>;
    try {
      const response = await doFetch(resolveUrl(input.path, baseUrl), {
        method,
        headers,
        body: method === 'GET' ? undefined : payload,
        signal: controller.signal,
        credentials: 'omit',
      });

      if (input.binary && response.ok) {
        const data = (await response.blob()) as T;
        result = { ok: true, status: response.status, data };
      } else {
        const text = await response.text();
        result = parseCoreEnvelope<T>(text, response.status);
      }
    } catch {
      result = fail<T>(
        0,
        PORTAL_ERROR.NETWORK_ERROR,
        'Unable to reach the server. Retry.',
      );
    } finally {
      window.clearTimeout(timer);
    }
    return result;
  }

  async function refreshSingleFlight(): Promise<boolean> {
    if (inFlightRefresh) {
      return inFlightRefresh;
    }
    inFlightRefresh = (async () => {
      const tokens = getTokens();
      const result = await executeOnce<Record<string, unknown>>(
        {
          path: REFRESH_PATH,
          method: 'POST',
          body: { refresh_token: tokens.refreshToken },
        },
        { skipAuth: true },
      );
      if (
        result.ok &&
        result.data &&
        typeof result.data === 'object' &&
        applyTokenPair(result.data, now())
      ) {
        return true;
      }
      die();
      return false;
    })().finally(() => {
      inFlightRefresh = null;
    });
    return inFlightRefresh;
  }

  async function request<T = unknown>(
    input: HostApiRequest,
    opts: { skipAuth?: boolean } = {},
  ): Promise<HostApiResponse<T>> {
    if (!isValidApiPath(input.path)) {
      const rejected = fail<T>(
        0,
        PORTAL_ERROR.INVALID_API_PATH,
        'API path must start with /api/v1/.',
      );
      emitApiError(emit, rejected);
      return rejected;
    }

    const method = input.method ?? 'GET';
    const skipAuth = opts.skipAuth === true;

    if (
      !skipAuth &&
      !isPublicAuthPath(input.path) &&
      shouldProactiveRefresh(getTokens(), now())
    ) {
      const refreshed = await refreshSingleFlight();
      if (!refreshed) {
        const dead = fail<T>(401, 'UNAUTHORIZED', 'Authentication required');
        emitApiError(emit, dead);
        return dead;
      }
    }

    let result = await executeOnce<T>(input, { skipAuth });
    let didRefresh = false;

    if (
      isUnauthorized(result) &&
      !skipAuth &&
      !isPublicAuthPath(input.path) &&
      getTokens().refreshToken
    ) {
      const refreshed = await refreshSingleFlight();
      didRefresh = true;
      if (refreshed) {
        result = await executeOnce<T>(input, { skipAuth });
      }
    }

    if (isTransient(method, result)) {
      await sleep(retryWaitMs(result));
      result = await executeOnce<T>(input, { skipAuth });
      if (
        isUnauthorized(result) &&
        !didRefresh &&
        !skipAuth &&
        !isPublicAuthPath(input.path) &&
        getTokens().refreshToken
      ) {
        const refreshed = await refreshSingleFlight();
        if (refreshed) {
          result = await executeOnce<T>(input, { skipAuth });
        }
      }
    }

    emitApiError(emit, result);
    return result;
  }

  return {
    request,
    createIdempotencyKey,
    reset: () => {
      inFlightRefresh = null;
    },
  };
}

export const hostApi = createApiClient();

export function resetApiClientState(): void {
  hostApi.reset();
  setSessionDeathHandler(null);
}
