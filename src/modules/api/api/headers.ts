export type BuildRequestHeadersInput = {
  accessToken: string | null;
  idempotencyKey?: string;
  extra?: Record<string, string>;
  jsonBody: boolean;
  skipAuth?: boolean;
};

const BLOCKED_EXTRA = /^(authorization|cookie|set-cookie|idempotency-key)$/i;

export function buildRequestHeaders({
  accessToken,
  idempotencyKey,
  extra,
  jsonBody,
  skipAuth = false,
}: BuildRequestHeadersInput): Headers {
  const headers = new Headers();

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (BLOCKED_EXTRA.test(key)) {
        continue;
      }
      headers.set(key, value);
    }
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (jsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken && !skipAuth) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  if (idempotencyKey) {
    headers.set('Idempotency-Key', idempotencyKey);
  }

  return headers;
}
