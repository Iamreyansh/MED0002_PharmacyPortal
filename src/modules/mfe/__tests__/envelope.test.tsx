import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_HOST_CONTEXT,
  buildHostContext,
  sanitizeRemoteApiResponse,
  stripRemoteSecrets,
  useHostCapabilities,
  useMfeEnvelope,
} from '@/modules/mfe';
import { setTokens } from '@/modules/api';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function CapProbe() {
  const caps = useHostCapabilities();
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          caps.navigate?.('/probed');
          void caps.api?.request({ path: '/api/v1/auth/me' }).then((res) => {
            const el = document.querySelector('[data-testid="api-status"]');
            if (el) el.textContent = String(res.status);
          });
          caps.api?.createIdempotencyKey?.();
          caps.telemetry?.track('probe');
          caps.events?.emit('probe');
          caps.events?.on('probe', () => undefined)();
        }}
        data-testid="nav-probe"
      >
        go
      </button>
      <span data-testid="api-status" />
    </div>
  );
}

function EnvelopeProbe({ withContext }: { withContext?: boolean }) {
  const data = useMfeEnvelope(
    { title: 'x' },
    withContext ? buildHostContext({ permissions: ['todo:read'] }) : undefined,
  );
  return (
    <div data-testid="envelope">
      {data.context.hostId}:{data.feature.title}:
      {data.context.permissions.join(',')}
    </div>
  );
}

describe('host envelope helpers', () => {
  it('builds host context with defaults and overrides', () => {
    expect(buildHostContext()).toEqual(DEFAULT_HOST_CONTEXT);
    const ctx = buildHostContext({
      hostId: 'custom',
      permissions: ['a'],
    });
    expect(ctx.hostId).toBe('custom');
    expect(ctx.permissions).toEqual(['a']);
    expect(ctx.locale).toBe('en-IN');
    expect(DEFAULT_HOST_CONTEXT.pharmacyId).toBeUndefined();
    expect(DEFAULT_HOST_CONTEXT.userId).toBeUndefined();
  });

  it('exposes router-backed navigate and a live API facade', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: true, data: { x: 1 } }), {
            status: 200,
          }),
      ),
    );
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <CapProbe />
      </MemoryRouter>,
    );
    await user.click(screen.getByTestId('nav-probe'));
    await waitFor(() => {
      expect(screen.getByTestId('api-status').textContent).toBe('200');
    });
  });

  it('delivers host events to subscribers and storefront status', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    function EventProbe() {
      const caps = useHostCapabilities();
      return (
        <button
          type="button"
          data-testid="event-probe"
          onClick={() => {
            const stop = caps.events?.on('probe', (payload) => {
              const el = document.querySelector('[data-testid="event-seen"]');
              if (el) el.textContent = String(payload);
            });
            caps.events?.emit('probe', 'hello');
            caps.events?.emit('pharmacy.storefront', { is_online: true });
            stop?.();
          }}
        >
          go
        </button>
      );
    }
    render(
      <MemoryRouter>
        <EventProbe />
        <span data-testid="event-seen" />
      </MemoryRouter>,
    );
    await user.click(screen.getByTestId('event-probe'));
    expect(screen.getByTestId('event-seen').textContent).toBe('hello');
    const { getStorefrontStatus } =
      await import('@/modules/settings/store/storefront-status');
    expect(getStorefrontStatus().isOnline).toBe(true);
  });

  it('builds envelopes with default and custom context', () => {
    const { rerender } = render(
      <MemoryRouter>
        <EnvelopeProbe />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('envelope').textContent).toContain(
      'pharmacy-portal:x:',
    );

    rerender(
      <MemoryRouter>
        <EnvelopeProbe withContext />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('envelope').textContent).toContain('todo:read');
  });

  it('does not put refresh_token on the MFE envelope', () => {
    setTokens({
      accessToken: 'access',
      refreshToken: 'secret-refresh-token',
      tokenType: 'Bearer',
      tokenScope: 'full',
      accessTokenExpiresAt: null,
    });
    function Probe() {
      const data = useMfeEnvelope({ title: 'x' });
      return <pre data-testid="raw">{JSON.stringify(data)}</pre>;
    }
    render(
      <MemoryRouter>
        <Probe />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('raw').textContent).not.toContain(
      'secret-refresh-token',
    );
  });

  it('does not put token field names on an auth feature envelope', () => {
    function Probe() {
      const data = useMfeEnvelope({
        portalType: 'pharmacy',
        onSubmit: async () => ({ ok: true }),
      });
      return <pre data-testid="auth-env">{JSON.stringify(data)}</pre>;
    }
    render(
      <MemoryRouter>
        <Probe />
      </MemoryRouter>,
    );
    const raw = screen.getByTestId('auth-env').textContent ?? '';
    expect(raw).not.toMatch(
      /access_token|refresh_token|mfa_challenge_token|accessToken|refreshToken/,
    );
  });

  it('strips token fields from remote API responses', async () => {
    expect(stripRemoteSecrets('ok')).toBe('ok');
    expect(stripRemoteSecrets(null)).toBeNull();
    expect(stripRemoteSecrets([{ access_token: 'a', name: 'Priya' }])).toEqual([
      { name: 'Priya' },
    ]);
    expect(
      sanitizeRemoteApiResponse({
        ok: true,
        status: 200,
        data: {
          access_token: 'secret',
          accessToken: 'also',
          staff: { refresh_token: 'r', refreshToken: 'r2', id: 's1' },
        },
        details: { mfa_challenge_token: 'mfa', attempts: 1 },
      }),
    ).toEqual({
      ok: true,
      status: 200,
      data: { staff: { id: 's1' } },
      details: { attempts: 1 },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: { access_token: 'leaked', id: 'ok' },
            }),
            { status: 200 },
          ),
      ),
    );
    function TokenProbe() {
      const caps = useHostCapabilities();
      return (
        <button
          type="button"
          data-testid="strip-probe"
          onClick={() => {
            void caps.api?.request({ path: '/api/v1/auth/me' }).then((res) => {
              const el = document.querySelector('[data-testid="stripped"]');
              if (el) el.textContent = JSON.stringify(res.data);
            });
          }}
        >
          go
        </button>
      );
    }
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TokenProbe />
        <span data-testid="stripped" />
      </MemoryRouter>,
    );
    await user.click(screen.getByTestId('strip-probe'));
    await waitFor(() => {
      expect(screen.getByTestId('stripped').textContent).toBe(
        JSON.stringify({ id: 'ok' }),
      );
      expect(screen.getByTestId('stripped').textContent).not.toContain(
        'leaked',
      );
    });
  });
});
