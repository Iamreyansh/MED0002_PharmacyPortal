/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REMOTE_TODO_URL?: string;
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
