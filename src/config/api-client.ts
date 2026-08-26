export const PORTAL_ERROR = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UPSTREAM_INVALID_JSON: 'UPSTREAM_INVALID_JSON',
  INVALID_API_PATH: 'INVALID_API_PATH',
} as const;

export const API_PREFIX = '/api/v1';
export const REQUEST_TIMEOUT_MS = 30_000;
export const ACCESS_REFRESH_SKEW_MS = 30_000;
export const REFRESH_PATH = '/api/v1/auth/refresh';

const PUBLIC_AUTH_PATHS = [
  '/api/v1/auth/refresh',
  '/api/v1/auth/pharmacy/login',
  '/api/v1/auth/pharmacy/pos-pin',
] as const;

export function isValidApiPath(path: string): boolean {
  return path.startsWith(`${API_PREFIX}/`);
}

export function isPublicAuthPath(path: string): boolean {
  const q = path.indexOf('?');
  const pathname = q === -1 ? path : path.slice(0, q);
  return (
    PUBLIC_AUTH_PATHS.includes(
      pathname as (typeof PUBLIC_AUTH_PATHS)[number],
    ) || pathname.startsWith('/api/v1/pharmacy/register')
  );
}
