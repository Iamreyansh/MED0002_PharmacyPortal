/**
 * Runtime helpers re-exported for host pages.
 * Prefer importing from `@medmate/federation-config` / `@medmate/host-kit` directly.
 */
export {
  buildFederationRemotes,
  getRemoteUrl,
  listConfiguredRemotes,
  type EnvRecord,
  type FederationRemote,
} from '@medmate/federation-config';
export {
  RemoteErrorBoundary,
  RemoteLoader,
  defaultRemoteImporter,
  getFederationHost,
  toRemoteModuleId,
  type RemoteImporter,
  type RemoteLoaderProps,
  type RemoteModule,
} from '@medmate/host-kit';
export {
  MFE_CONTRACT_VERSION,
  assertMfeDataEnvelope,
  isSupportedContractVersion,
  type HostCapabilities,
  type HostContext,
  type MfeDataEnvelope,
  type MfeProps,
} from '@medmate/contracts';
export { REMOTE_REGISTRY } from '../../config/remotes.registry';
