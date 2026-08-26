import {
  MFE_CONTRACT_VERSION,
  type HostApiResponse,
  type HostCapabilities,
  type HostContext,
  type MfeDataEnvelope,
} from '@medmate/contracts';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { hostApi } from '@/modules/api';
import { createIdempotencyKey } from '@/modules/api';
import { track } from '@/modules/api';

export const DEFAULT_HOST_CONTEXT: HostContext = {
  hostId: 'pharmacy-portal',
  locale: 'en-IN',
  permissions: [],
};

const REMOTE_SECRET_KEYS = new Set([
  'access_token',
  'refresh_token',
  'mfa_challenge_token',
  'accessToken',
  'refreshToken',
]);

export function stripRemoteSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripRemoteSecrets(item)) as T;
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const next: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (REMOTE_SECRET_KEYS.has(key)) {
      continue;
    }
    next[key] = stripRemoteSecrets(nested);
  }
  return next as T;
}

export function sanitizeRemoteApiResponse<T>(
  result: HostApiResponse<T>,
): HostApiResponse<T> {
  return {
    ...result,
    data: stripRemoteSecrets(result.data),
    details: stripRemoteSecrets(result.details),
  };
}

export function buildHostContext(
  overrides: Partial<HostContext> = {},
): HostContext {
  return {
    ...DEFAULT_HOST_CONTEXT,
    ...overrides,
    permissions: overrides.permissions ?? DEFAULT_HOST_CONTEXT.permissions,
  };
}

export function useHostCapabilities(): HostCapabilities {
  const navigate = useNavigate();

  return useMemo(
    () => ({
      navigate: (path: string) => {
        navigate(path);
      },
      telemetry: {
        track,
      },
      events: {
        emit: () => undefined,
        on: () => () => undefined,
      },
      api: {
        request: async (input) =>
          sanitizeRemoteApiResponse(await hostApi.request(input)),
        createIdempotencyKey,
      },
    }),
    [navigate],
  );
}

export function useMfeEnvelope<TFeature>(
  feature: TFeature,
  context: HostContext = DEFAULT_HOST_CONTEXT,
): MfeDataEnvelope<TFeature> {
  const capabilities = useHostCapabilities();

  return useMemo(
    () => ({
      contractVersion: MFE_CONTRACT_VERSION,
      context,
      feature,
      capabilities,
    }),
    [capabilities, context, feature],
  );
}
