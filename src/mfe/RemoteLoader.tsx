import {
  Component,
  Suspense,
  lazy,
  useMemo,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { getRemoteUrl } from './remotes.config';

export type RemoteModule = {
  default: ComponentType<Record<string, unknown>>;
};

export type RemoteImporter = (
  remote: string,
  module: string,
) => Promise<RemoteModule>;

export type RemoteLoaderProps = {
  remote: string;
  module: string;
  componentProps?: Record<string, unknown>;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  loadRemote?: RemoteImporter;
};

type ErrorBoundaryProps = {
  fallback: ReactNode;
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = { hasError: boolean };

export class RemoteErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public override state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const defaultRemoteImporter: RemoteImporter = (remote, module) =>
  import(/* @vite-ignore */ `${remote}/${module}`) as Promise<RemoteModule>;

function MissingRemote({ remote }: { remote: string }) {
  return (
    <div role="alert" data-testid="remote-missing">
      Remote &quot;{remote}&quot; is not configured. Set VITE_REMOTE_
      {remote.toUpperCase()}_URL.
    </div>
  );
}

function DefaultRemoteError({ remote }: { remote: string }) {
  return (
    <div role="alert" data-testid="remote-error">
      Failed to load remote &quot;{remote}&quot;.
    </div>
  );
}

export function RemoteLoader({
  remote,
  module,
  componentProps,
  fallback = <p>Loading micro-frontend…</p>,
  errorFallback,
  loadRemote = defaultRemoteImporter,
}: RemoteLoaderProps) {
  const remoteUrl = getRemoteUrl(remote);

  const resolvedErrorFallback = useMemo(
    () => errorFallback ?? <DefaultRemoteError remote={remote} />,
    [errorFallback, remote],
  );

  const LazyRemote = useMemo(() => {
    if (!remoteUrl) {
      return null;
    }

    return lazy(async () => {
      try {
        return await loadRemote(remote, module);
      } catch {
        return {
          default: function RemoteLoadFailure() {
            return <>{resolvedErrorFallback}</>;
          },
        };
      }
    });
  }, [remote, module, remoteUrl, loadRemote, resolvedErrorFallback]);

  if (!LazyRemote) {
    return <MissingRemote remote={remote} />;
  }

  return (
    <RemoteErrorBoundary fallback={resolvedErrorFallback}>
      <Suspense fallback={fallback}>
        <LazyRemote {...(componentProps ?? {})} />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
