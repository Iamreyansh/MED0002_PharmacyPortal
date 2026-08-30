import { afterEach, describe, expect, it, vi } from 'vitest';
import { hostApi, setTokens, subscribeTelemetry } from '@/modules/api';
import {
  getStoredDeviceId,
  readPushLogId,
  registerDeviceToken,
  reportPushOpened,
  resetDeviceTokenStore,
  unregisterDeviceToken,
} from '@/modules/session/lib/device-token';

afterEach(() => {
  resetDeviceTokenStore();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function fullTokens() {
  setTokens({
    accessToken: 'a',
    refreshToken: 'r',
    tokenType: 'Bearer',
    tokenScope: 'full',
    accessTokenExpiresAt: null,
  });
}

function grantNotification() {
  vi.stubGlobal('Notification', {
    permission: 'granted',
    requestPermission: vi.fn(async () => 'granted'),
  });
}

describe('device-token', () => {
  it('skips POS and missing permission without crashing', async () => {
    setTokens({
      accessToken: 'p',
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'pos',
      accessTokenExpiresAt: null,
    });
    const request = vi.spyOn(hostApi, 'request');
    await expect(registerDeviceToken()).resolves.toBe('skipped');
    expect(request).not.toHaveBeenCalled();
    fullTokens();
    vi.stubGlobal('Notification', {
      permission: 'denied',
      requestPermission: vi.fn(async () => 'denied'),
    });
    await expect(registerDeviceToken()).resolves.toBe('denied');
    expect(request).not.toHaveBeenCalled();
  });

  it('posts Core DTO after permission grant and ignores validation errors', async () => {
    fullTokens();
    grantNotification();
    const request = vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { registered: true, device_id: 'dev-1', platform: 'ANDROID' },
    });
    const events: Array<{ event: string; props?: Record<string, unknown> }> =
      [];
    const stop = subscribeTelemetry((event, props) => {
      events.push({ event, props });
    });
    await expect(registerDeviceToken()).resolves.toBe('ok');
    expect(request).toHaveBeenCalledWith({
      path: '/api/v1/pharmacy/me/device-token',
      method: 'POST',
      body: {
        token: expect.any(String),
        platform: 'ANDROID',
        device_id: expect.any(String),
      },
    });
    expect(events.every((entry) => entry.props?.result)).toBe(true);
    expect(JSON.stringify(events.map((entry) => entry.props))).not.toMatch(
      /authorization|bearer/i,
    );
    request.mockResolvedValueOnce({
      ok: false,
      status: 422,
      data: undefined as never,
      code: 'VALIDATION_ERROR',
      message: 'Invalid',
    });
    await expect(registerDeviceToken()).resolves.toBe('error');
    stop();
  });

  it('unregisters even when register POST failed', async () => {
    fullTokens();
    grantNotification();
    const request = vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: false,
      status: 422,
      data: undefined as never,
      code: 'VALIDATION_ERROR',
    });
    await expect(registerDeviceToken()).resolves.toBe('error');
    const deviceId = getStoredDeviceId();
    expect(deviceId).toBeTruthy();
    request.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { unregistered: true },
    });
    await expect(unregisterDeviceToken()).resolves.toBe('ok');
    expect(request).toHaveBeenLastCalledWith({
      path: '/api/v1/pharmacy/me/device-token',
      method: 'DELETE',
      body: { device_id: deviceId },
    });
  });

  it('requests permission, reuses stored ids, and swallows thrown requests', async () => {
    fullTokens();
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn(async () => 'granted'),
    });
    sessionStorage.setItem('medmate.portal.device-id', 'stored-device');
    sessionStorage.setItem('medmate.portal.push-token', 'stored-push');
    const request = vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { registered: true },
    });
    await expect(registerDeviceToken()).resolves.toBe('ok');
    expect(request.mock.calls[0]?.[0]?.body).toMatchObject({
      token: 'stored-push',
      device_id: 'stored-device',
    });
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn(async () => {
        throw new Error('blocked');
      }),
    });
    await expect(registerDeviceToken()).resolves.toBe('denied');
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn(async () => 'default'),
    });
    await expect(registerDeviceToken()).resolves.toBe('denied');
    grantNotification();
    request.mockRejectedValueOnce(new Error('offline'));
    await expect(registerDeviceToken()).resolves.toBe('error');
    request.mockRejectedValueOnce(new Error('offline'));
    await expect(unregisterDeviceToken()).resolves.toBe('error');
  });

  it('skips register without Notification and unregister without a token', async () => {
    fullTokens();
    vi.stubGlobal('Notification', undefined);
    await expect(registerDeviceToken()).resolves.toBe('skipped');
    setTokens({
      accessToken: null,
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    await expect(unregisterDeviceToken()).resolves.toBe('skipped');
  });

  it('falls back when crypto.randomUUID is missing', async () => {
    fullTokens();
    grantNotification();
    vi.stubGlobal('crypto', {});
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { registered: true },
    });
    await expect(registerDeviceToken()).resolves.toBe('ok');
    expect(getStoredDeviceId()).toMatch(/^dev-/);
  });

  it('reports opened log ids and ignores junk', async () => {
    fullTokens();
    const request = vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { opened: true, log_id: 'a1000001-0000-4000-8000-000000000001' },
    });
    expect(readPushLogId('?foo=1')).toBeNull();
    expect(readPushLogId('?log_id=a1000001-0000-4000-8000-000000000001')).toBe(
      'a1000001-0000-4000-8000-000000000001',
    );
    await expect(reportPushOpened('not-a-uuid')).resolves.toBe('skipped');
    expect(request).not.toHaveBeenCalled();
    await expect(
      reportPushOpened('a1000001-0000-4000-8000-000000000001'),
    ).resolves.toBe('ok');
    expect(request).toHaveBeenCalledWith({
      path: '/api/v1/notifications/push/opened',
      method: 'POST',
      body: { log_id: 'a1000001-0000-4000-8000-000000000001' },
    });
    request.mockResolvedValueOnce({
      ok: false,
      status: 422,
      data: undefined as never,
      code: 'VALIDATION_ERROR',
    });
    await expect(
      reportPushOpened('a1000001-0000-4000-8000-000000000001'),
    ).resolves.toBe('error');
    request.mockRejectedValueOnce(new Error('offline'));
    await expect(
      reportPushOpened('a1000001-0000-4000-8000-000000000001'),
    ).resolves.toBe('error');
  });
});
