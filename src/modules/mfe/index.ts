export { MfeOutlet, withTimeout } from '@/modules/mfe/ui/MfeOutlet';
export { defaultReload } from '@/modules/mfe/lib/reload';
export {
  getRemoteMeta,
  isDemoRemotesEnabled,
  listProductMounts,
  listProductRemoteNames,
} from '@/modules/mfe/lib/registry';
export type { RemoteMount } from '@/modules/mfe/lib/registry';
export {
  DEFAULT_HOST_CONTEXT,
  buildHostContext,
  useHostCapabilities,
  useMfeEnvelope,
} from '@/modules/mfe/lib/envelope';
