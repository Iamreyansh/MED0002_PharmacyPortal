import {
  MFE_CONTRACT_VERSION,
  type HostCapabilities,
  type HostContext,
  type MfeDataEnvelope,
} from '@medmate/contracts';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export const DEFAULT_HOST_CONTEXT: HostContext = {
  hostId: 'pharmacy-portal',
  locale: 'en-IN',
  pharmacyId: 'demo-pharmacy',
  userId: 'demo-user',
  permissions: [],
};

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
        track: () => undefined,
      },
      events: {
        emit: () => undefined,
        on: () => () => undefined,
      },
      api: {
        request: async () => ({
          ok: false,
          status: 501,
          data: null as never,
        }),
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
