/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MFE_DOMAIN_SUFFIX?: string;
  readonly VITE_REMOTE_TODO_URL?: string;
  readonly VITE_REMOTE_AUTH_URL?: string;
  readonly VITE_REMOTE_ONBOARDING_URL?: string;
  readonly VITE_ENABLE_DEMO_REMOTES?: string;
  readonly VITE_SESSION_FIXTURE?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_MFE_DIST_ROOT?: string;
  readonly VITE_DISABLE_LOCAL_MFE_DIST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv & Record<string, string | undefined>;
}

declare module '@medmate/ui' {
  import type { ComponentType } from 'react';
  export const Spinner: ComponentType<{ className?: string; block?: boolean }>;
}
