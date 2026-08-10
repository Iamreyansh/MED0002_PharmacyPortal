import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const REMOTE_ENV_PATTERN = /^VITE_REMOTE_([A-Z0-9_]+)_URL$/;

function buildRemotesFromEnv(env: Record<string, string>) {
  const remotes: Record<
    string,
    {
      type: 'module';
      name: string;
      entry: string;
      entryGlobalName: string;
      shareScope: string;
    }
  > = {};

  for (const [key, value] of Object.entries(env)) {
    if (!value) continue;
    const match = REMOTE_ENV_PATTERN.exec(key);
    if (!match?.[1]) continue;
    const name = match[1].toLowerCase();
    remotes[name] = {
      type: 'module',
      name,
      entry: value,
      entryGlobalName: name,
      shareScope: 'default',
    };
  }

  return remotes;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const remotes = buildRemotesFromEnv(env);

  return {
    plugins: [
      react(),
      federation({
        name: 'pharmacy_portal_host',
        filename: 'remoteEntry.js',
        remotes,
        shared: {
          react: {
            singleton: true,
            requiredVersion: '18.3.1',
            strictVersion: true,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: '18.3.1',
            strictVersion: true,
          },
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    build: {
      target: 'chrome89',
    },
    server: {
      origin: 'http://localhost:5173',
      port: 5173,
    },
  };
});
