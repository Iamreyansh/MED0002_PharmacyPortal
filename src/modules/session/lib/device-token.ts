import { PORTAL_DEVICE_ID_KEY, PORTAL_PUSH_TOKEN_KEY } from '@/config/session';
import { hostApi, track } from '@/modules/api';
import { getTokens } from '@/modules/api/store/token-store';

const DEVICE_TOKEN_PATH = '/api/v1/pharmacy/me/device-token';
const PUSH_OPENED_PATH = '/api/v1/notifications/push/opened';
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type DeviceTokenResult = 'ok' | 'skipped' | 'denied' | 'error';

export function resetDeviceTokenStore(): void {
  sessionStorage.removeItem(PORTAL_DEVICE_ID_KEY);
  sessionStorage.removeItem(PORTAL_PUSH_TOKEN_KEY);
}

export function getStoredDeviceId(): string | null {
  return sessionStorage.getItem(PORTAL_DEVICE_ID_KEY);
}

export async function registerDeviceToken(): Promise<DeviceTokenResult> {
  const tokens = getTokens();
  if (!tokens.accessToken || tokens.tokenScope === 'pos') {
    emit('device_token_register', 'skipped');
    return 'skipped';
  }
  if (typeof Notification === 'undefined') {
    emit('device_token_register', 'skipped');
    return 'skipped';
  }
  let permission = Notification.permission;
  if (permission === 'denied') {
    emit('device_token_register', 'denied');
    return 'denied';
  }
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      emit('device_token_register', 'denied');
      return 'denied';
    }
  }
  if (permission !== 'granted') {
    emit('device_token_register', 'denied');
    return 'denied';
  }
  const deviceId = ensureDeviceId();
  const token = ensurePushToken();
  try {
    const result = await hostApi.request({
      path: DEVICE_TOKEN_PATH,
      method: 'POST',
      body: {
        token,
        platform: 'ANDROID',
        device_id: deviceId,
      },
    });
    if (!result.ok) {
      emit('device_token_register', 'error');
      return 'error';
    }
    emit('device_token_register', 'ok');
    return 'ok';
  } catch {
    emit('device_token_register', 'error');
    return 'error';
  }
}

export async function unregisterDeviceToken(): Promise<DeviceTokenResult> {
  const deviceId = getStoredDeviceId() ?? ensureDeviceId();
  if (!getTokens().accessToken) {
    emit('device_token_unregister', 'skipped');
    return 'skipped';
  }
  try {
    await hostApi.request({
      path: DEVICE_TOKEN_PATH,
      method: 'DELETE',
      body: { device_id: deviceId },
    });
    emit('device_token_unregister', 'ok');
    return 'ok';
  } catch {
    emit('device_token_unregister', 'error');
    return 'error';
  }
}

export async function reportPushOpened(
  logId: string | null | undefined,
): Promise<DeviceTokenResult> {
  if (!logId || !UUID_RE.test(logId) || !getTokens().accessToken) {
    return 'skipped';
  }
  try {
    const result = await hostApi.request({
      path: PUSH_OPENED_PATH,
      method: 'POST',
      body: { log_id: logId },
    });
    if (!result.ok) {
      return 'error';
    }
    return 'ok';
  } catch {
    return 'error';
  }
}

export function readPushLogId(search: string): string | null {
  const value = new URLSearchParams(search).get('log_id');
  return value && UUID_RE.test(value) ? value : null;
}

function ensureDeviceId(): string {
  const existing = sessionStorage.getItem(PORTAL_DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const next = createId();
  sessionStorage.setItem(PORTAL_DEVICE_ID_KEY, next);
  return next;
}

function ensurePushToken(): string {
  const existing = sessionStorage.getItem(PORTAL_PUSH_TOKEN_KEY);
  if (existing) {
    return existing;
  }
  const next = createId();
  sessionStorage.setItem(PORTAL_PUSH_TOKEN_KEY, next);
  return next;
}

function createId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emit(
  event: 'device_token_register' | 'device_token_unregister',
  result: DeviceTokenResult,
): void {
  track(event, { result });
}
