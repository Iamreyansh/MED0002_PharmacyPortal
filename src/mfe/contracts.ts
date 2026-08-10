/**
 * Shared MFE contract types mirrored from @medmate/contracts.
 * Kept local so the host repo does not depend on the monorepo package path.
 */

export const MFE_CONTRACT_VERSION = '1.0.0' as const;

export type HostContext = {
  hostId: string;
  locale: string;
  pharmacyId?: string;
  userId?: string;
  permissions: readonly string[];
};

export type HostCapabilities = {
  navigate?: (path: string) => void;
  api?: {
    request: <T = unknown>(input: {
      path: string;
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: unknown;
      headers?: Record<string, string>;
    }) => Promise<{ ok: boolean; status: number; data: T }>;
  };
  events?: {
    emit: (event: string, payload?: unknown) => void;
    on: (event: string, handler: (payload?: unknown) => void) => () => void;
  };
  telemetry?: {
    track: (event: string, properties?: Record<string, unknown>) => void;
  };
};

export type MfeDataEnvelope<TFeature = unknown> = {
  contractVersion: typeof MFE_CONTRACT_VERSION;
  context: HostContext;
  feature: TFeature;
  capabilities?: HostCapabilities;
};

export type MfeProps<TFeature = unknown> = {
  data: Readonly<MfeDataEnvelope<TFeature>>;
};

export type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
};

export type TodoFeatureData = {
  title?: string;
  initialItems?: readonly TodoItem[];
  initialFilter?: 'all' | 'active' | 'completed';
  onChange?: (items: readonly TodoItem[]) => void;
};
