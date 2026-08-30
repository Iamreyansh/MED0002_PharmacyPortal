import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hostApi, setTokens } from '@/modules/api';
import {
  DeviceTokenLifecycle,
  SessionProvider,
  SESSION_FIXTURES,
} from '@/modules/session';
import { resetDeviceTokenStore } from '@/modules/session/lib/device-token';

afterEach(() => {
  cleanup();
  resetDeviceTokenStore();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('DeviceTokenLifecycle', () => {
  it('registers once for a ready pharmacy session', async () => {
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    vi.stubGlobal('Notification', {
      permission: 'granted',
      requestPermission: vi.fn(async () => 'granted'),
    });
    const request = vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { registered: true },
    });
    const { rerender } = render(
      <SessionProvider session={SESSION_FIXTURES['owner-free']}>
        <DeviceTokenLifecycle />
      </SessionProvider>,
    );
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/v1/pharmacy/me/device-token',
          method: 'POST',
        }),
      );
    });
    rerender(
      <SessionProvider session={SESSION_FIXTURES['owner-free']}>
        <DeviceTokenLifecycle />
      </SessionProvider>,
    );
    expect(
      request.mock.calls.filter(
        (call) =>
          call[0]?.method === 'POST' && call[0]?.path.includes('device-token'),
      ),
    ).toHaveLength(1);
  });

  it('reports a deep-link log_id after ready', async () => {
    setTokens({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    vi.stubGlobal('Notification', {
      permission: 'granted',
      requestPermission: vi.fn(async () => 'granted'),
    });
    window.history.replaceState(
      {},
      '',
      '/?log_id=a1000001-0000-4000-8000-000000000001',
    );
    const request = vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: {},
    });
    render(
      <SessionProvider session={SESSION_FIXTURES['owner-free']}>
        <DeviceTokenLifecycle />
      </SessionProvider>,
    );
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith({
        path: '/api/v1/notifications/push/opened',
        method: 'POST',
        body: { log_id: 'a1000001-0000-4000-8000-000000000001' },
      });
    });
    window.history.replaceState({}, '', '/');
  });

  it('skips unauthenticated sessions', async () => {
    const request = vi.spyOn(hostApi, 'request');
    render(
      <SessionProvider session={SESSION_FIXTURES.unauthenticated}>
        <DeviceTokenLifecycle />
      </SessionProvider>,
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(request).not.toHaveBeenCalled();
  });

  it('skips POS sessions', async () => {
    setTokens({
      accessToken: 'p',
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'pos',
      accessTokenExpiresAt: null,
    });
    const request = vi.spyOn(hostApi, 'request');
    render(
      <SessionProvider session={SESSION_FIXTURES['pos-scope']}>
        <DeviceTokenLifecycle />
      </SessionProvider>,
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(request).not.toHaveBeenCalled();
  });
});
