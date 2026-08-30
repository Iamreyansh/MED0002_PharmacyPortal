import { hostApi } from '@/modules/api/api/client';
import { clearTokens, getTokens } from '@/modules/api/store/token-store';
import { unregisterDeviceToken } from '@/modules/session/lib/device-token';
import { clearSessionSnapshot } from '@/modules/session/store/snapshot';

export type LogoutDestination = '/login' | '/pos-login';

export async function performLogout(
  options: { all?: boolean } = {},
): Promise<LogoutDestination> {
  const tokens = getTokens();
  const destination: LogoutDestination =
    tokens.tokenScope === 'pos' ? '/pos-login' : '/login';
  try {
    await unregisterDeviceToken();
  } catch {
    // Fail-safe: logout continues even if unregister fails.
  }
  try {
    if (options.all) {
      await hostApi.request({
        path: '/api/v1/auth/logout-all',
        method: 'POST',
        body: {},
      });
    } else if (tokens.refreshToken) {
      await hostApi.request({
        path: '/api/v1/auth/logout',
        method: 'POST',
        body: { refresh_token: tokens.refreshToken },
      });
    }
  } catch {
    // Fail-safe: local session is still cleared below.
  } finally {
    clearTokens();
    clearSessionSnapshot();
  }
  return destination;
}
