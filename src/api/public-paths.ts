export function isValidApiPath(path: string): boolean {
  return path.startsWith('/api/v1/');
}

export function isPublicAuthPath(path: string): boolean {
  const q = path.indexOf('?');
  const pathname = q === -1 ? path : path.slice(0, q);
  return (
    pathname === '/api/v1/auth/refresh' ||
    pathname === '/api/v1/auth/pharmacy/login' ||
    pathname === '/api/v1/auth/pharmacy/pos-pin' ||
    pathname.startsWith('/api/v1/pharmacy/register')
  );
}
