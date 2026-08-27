import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHostViteConfig } from '@medmate/vite-config';
import { loadEnv } from 'vite';
import {
  applyLocalMfeRemoteUrls,
  localMfeRemoteDefines,
  resolveMfeDistRoot,
  serveLocalMfeDist,
} from './vite.local-mfe-dist';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const mode =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';
const env = loadEnv(mode, rootDir, 'VITE_');
const apiProxyTarget = (
  env.VITE_API_PROXY_TARGET ||
  env.VITE_API_BASE_URL ||
  'http://localhost:8080'
).replace(/\/$/, '');
const hostPort = 5173;
const mfeDistRoot = resolveMfeDistRoot({
  ...env,
  VITE_MFE_DIST_ROOT: process.env.VITE_MFE_DIST_ROOT ?? env.VITE_MFE_DIST_ROOT,
  VITE_DISABLE_LOCAL_MFE_DIST:
    process.env.VITE_DISABLE_LOCAL_MFE_DIST ?? env.VITE_DISABLE_LOCAL_MFE_DIST,
});

const localRemoteUrls = applyLocalMfeRemoteUrls({
  env,
  processEnv: process.env,
  distRoot: mfeDistRoot,
  origin: `http://localhost:${hostPort}`,
});

export default createHostViteConfig({
  rootDir,
  name: 'pharmacy_portal_host',
  port: hostPort,
  // Remotes may mount Redux via @medmate/mfe-kit — share singletons with host.
  shareRedux: true,
  override: {
    define: localMfeRemoteDefines(localRemoteUrls),
    plugins: [serveLocalMfeDist(mfeDistRoot)],
    resolve: {
      alias: {
        '@medmate/ui': path.resolve(rootDir, 'src/app/lib/medmate-ui-shim.tsx'),
      },
    },
    server: {
      fs: {
        allow: [rootDir, mfeDistRoot],
      },
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  },
});
