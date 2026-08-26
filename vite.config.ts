import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHostViteConfig } from '@medmate/vite-config';
import { loadEnv } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const env = loadEnv(process.env.NODE_ENV === 'production' ? 'production' : 'development', rootDir, 'VITE_');
const apiProxyTarget = (
  env.VITE_API_PROXY_TARGET ||
  env.VITE_API_BASE_URL ||
  'http://localhost:8080'
).replace(/\/$/, '');

export default createHostViteConfig({
  rootDir,
  name: 'pharmacy_portal_host',
  port: 5173,
  // Remotes may mount Redux via @medmate/mfe-kit — share singletons with host.
  shareRedux: true,
  override: {
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  },
});
