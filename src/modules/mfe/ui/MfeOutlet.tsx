import {
  RemoteLoader,
  defaultRemoteImporter,
  type RemoteImporter,
} from '@medmate/host-kit';
import {
  isSupportedContractVersion,
  type MfeDataEnvelope,
} from '@medmate/contracts';
import { useMemo, useState } from 'react';
import { defaultReload } from '@/modules/mfe/lib/reload';
import { ensureRemoteRegistered } from '@/modules/mfe/lib/register-remote';

export const DEFAULT_REMOTE_LOAD_TIMEOUT_MS = 8000;

export type MfeOutletProps = {
  remote: string;
  module: string;
  remoteUrl?: string | null;
  data: MfeDataEnvelope;
  loadRemote?: RemoteImporter;
  loadTimeoutMs?: number;
  onReload?: () => void;
};

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Remote load timed out'));
    }, ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (reason: unknown) => {
        window.clearTimeout(timer);
        reject(reason);
      },
    );
  });
}

export function MfeOutlet({
  remote,
  module,
  remoteUrl,
  data,
  loadRemote,
  loadTimeoutMs = DEFAULT_REMOTE_LOAD_TIMEOUT_MS,
  onReload = defaultReload,
}: MfeOutletProps) {
  const [loadKey, setLoadKey] = useState(0);

  const errorFallback = useMemo(
    () => (
      <div className="remote-panel" role="alert" data-testid="remote-error">
        <p>
          This module could not be loaded. The rest of the portal is still
          available.
        </p>
        <div className="remote-panel__actions">
          <button
            type="button"
            onClick={() => {
              setLoadKey((key) => key + 1);
            }}
          >
            Retry
          </button>
        </div>
      </div>
    ),
    [],
  );

  const wrappedLoad: RemoteImporter = useMemo(() => {
    const importer = loadRemote ?? defaultRemoteImporter;
    return async (name, expose) => {
      ensureRemoteRegistered(name, remoteUrl);
      try {
        return await withTimeout(importer(name, expose), loadTimeoutMs);
      } catch (error) {
        data.capabilities?.telemetry?.track('mfe_load_error', { remote: name });
        throw error;
      }
    };
  }, [data.capabilities?.telemetry, loadRemote, loadTimeoutMs, remoteUrl]);

  if (!isSupportedContractVersion(data.contractVersion)) {
    return (
      <div
        className="remote-panel"
        role="alert"
        data-testid="contract-mismatch"
      >
        <p>
          This module needs portal contract 1.0.0. Reload after updating; the
          console will not crash.
        </p>
        <div className="remote-panel__actions">
          <button type="button" onClick={onReload}>
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <RemoteLoader
      key={loadKey}
      remote={remote}
      module={module}
      remoteUrl={remoteUrl}
      componentProps={{ data }}
      loadRemote={wrappedLoad}
      errorFallback={errorFallback}
    />
  );
}
