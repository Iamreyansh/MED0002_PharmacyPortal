import type { HostApiResponse } from '@medmate/contracts';
import { PORTAL_ERROR } from '@/api/codes';

type CoreErrorBody = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  retry_after_seconds?: unknown;
};

function invalidJson<T>(status: number): HostApiResponse<T> {
  return {
    ok: false,
    status,
    data: null as T,
    code: PORTAL_ERROR.UPSTREAM_INVALID_JSON,
    message: 'The server returned a response that could not be read.',
  };
}

export function parseCoreEnvelope<T = unknown>(
  text: string,
  status: number,
): HostApiResponse<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return invalidJson<T>(status);
  }

  if (!parsed || typeof parsed !== 'object' || !('success' in parsed)) {
    return invalidJson<T>(status);
  }

  const envelope = parsed as {
    success: unknown;
    data?: unknown;
    error?: CoreErrorBody | null;
  };

  if (envelope.success === true) {
    return { ok: true, status, data: envelope.data as T };
  }

  if (envelope.success !== false) {
    return invalidJson<T>(status);
  }

  const error = envelope.error ?? {};
  const retryAfter =
    typeof error.retry_after_seconds === 'number'
      ? error.retry_after_seconds
      : undefined;

  return {
    ok: false,
    status,
    data: null as T,
    code: typeof error.code === 'string' ? error.code : 'UNKNOWN',
    message: typeof error.message === 'string' ? error.message : undefined,
    details: error.details,
    retryAfterSeconds: retryAfter,
  };
}
