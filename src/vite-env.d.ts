/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REMOTE_TODO_URL?: string;
  readonly VITE_ENABLE_DEMO_REMOTES?: string;
  readonly VITE_SESSION_FIXTURE?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv & Record<string, string | undefined>;
}
