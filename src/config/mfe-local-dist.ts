export const DEFAULT_MFE_DIST_ROOT =
  '/Volumes/SSD/codebase/medmate/MED0003_MFE/dist';
export const MFE_LOCAL_PREFIX = '/__mfe';

export type EnvLike = Record<string, string | undefined>;

export function resolveMfeDistRoot(env: EnvLike): string {
  return (env.VITE_MFE_DIST_ROOT || DEFAULT_MFE_DIST_ROOT).replace(/\/$/, '');
}

export function localManifestPath(name: string): string {
  return `${MFE_LOCAL_PREFIX}/${name}/mf-manifest.json`;
}

export function localManifestUrl(name: string, origin: string): string {
  return `${origin.replace(/\/$/, '')}${localManifestPath(name)}`;
}

export function isLocalMfeDistDisabled(env: EnvLike): boolean {
  return env.VITE_DISABLE_LOCAL_MFE_DIST === 'true';
}
