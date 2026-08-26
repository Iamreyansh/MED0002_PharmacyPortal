import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin, PreviewServer, ViteDevServer } from 'vite';

export const DEFAULT_MFE_DIST_ROOT =
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
export const MFE_LOCAL_PREFIX = '/__mfe';

const MIME: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.html': 'text/html; charset=utf-8',
};

export type EnvLike = Record<string, string | undefined>;

export function resolveMfeDistRoot(env: EnvLike): string {
  return (env.VITE_MFE_DIST_ROOT || DEFAULT_MFE_DIST_ROOT).replace(/\/$/, '');
}

export function isLocalMfeDistDisabled(env: EnvLike): boolean {
  return env.VITE_DISABLE_LOCAL_MFE_DIST === 'true';
}

export function localManifestPath(name: string): string {
  return `${MFE_LOCAL_PREFIX}/${name}/mf-manifest.json`;
}

export function localManifestUrl(name: string, origin: string): string {
  return `${origin.replace(/\/$/, '')}${localManifestPath(name)}`;
}

function remoteEnvKey(name: string): string {
  return `VITE_REMOTE_${name.toUpperCase().replace(/-/g, '_')}_URL`;
}

/**
 * When a remote URL is unset, point it at the sibling MED0003 dist served at /__mfe.
 * Returns Vite `define` values for `import.meta.env.VITE_REMOTE_*_URL`.
 * Do not write those keys onto `process.env`: `@module-federation/vite` would
 * register them at host init and `hostAutoInit` would block bootstrap.
 * Explicit URLs in env still win. Playwright sets VITE_DISABLE_LOCAL_MFE_DIST.
 */
export function applyLocalMfeRemoteUrls(options: {
  env: EnvLike;
  processEnv: NodeJS.ProcessEnv;
  distRoot: string;
  origin: string;
}): Record<string, string> {
  const { env, processEnv, distRoot } = options;
  if (isLocalMfeDistDisabled(env) || isLocalMfeDistDisabled(processEnv)) {
    return {};
  }
  if (!fs.existsSync(distRoot)) {
    return {};
  }

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(distRoot, { withFileTypes: true });
  } catch {
    return {};
  }

  const urls: Record<string, string> = {};
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const manifest = path.join(distRoot, entry.name, 'mf-manifest.json');
    if (!fs.existsSync(manifest)) {
      continue;
    }
    const key = remoteEnvKey(entry.name);
    const current = processEnv[key] ?? env[key];
    if (current) {
      continue;
    }
    urls[key] = localManifestPath(entry.name);
  }
  return urls;
}

export function localMfeRemoteDefines(
  urls: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(urls).map(([key, value]) => [
      `import.meta.env.${key}`,
      JSON.stringify(value),
    ]),
  );
}

function contentType(filePath: string): string {
  return MIME[path.extname(filePath)] ?? 'application/octet-stream';
}

function serveFromDist(
  distRoot: string,
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): void {
  const rawUrl = req.url ?? '';
  if (!rawUrl.startsWith(`${MFE_LOCAL_PREFIX}/`)) {
    next();
    return;
  }

  const relative = decodeURIComponent(
    rawUrl.slice(MFE_LOCAL_PREFIX.length + 1).split('?')[0] ?? '',
  );
  const resolvedRoot = path.resolve(distRoot);
  const filePath = path.resolve(resolvedRoot, relative);
  const rootWithSep = resolvedRoot.endsWith(path.sep)
    ? resolvedRoot
    : `${resolvedRoot}${path.sep}`;
  if (filePath !== resolvedRoot && !filePath.startsWith(rootWithSep)) {
    res.statusCode = 403;
    res.end();
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.end();
      return;
    }
    res.setHeader('Content-Type', contentType(filePath));
    res.setHeader('Cache-Control', 'no-cache');
    fs.createReadStream(filePath).pipe(res);
  });
}

export function serveLocalMfeDist(distRoot: string): Plugin {
  const attach = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use(
      (
        req: Connect.IncomingMessage,
        res: ServerResponse,
        next: Connect.NextFunction,
      ) => {
        serveFromDist(distRoot, req, res, next);
      },
    );
  };

  return {
    name: 'serve-local-mfe-dist',
    configureServer: attach,
    configurePreviewServer: attach,
  };
}
