import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_HOST_CONTEXT,
  buildHostContext,
  sanitizeRemoteApiResponse,
  stripRemoteSecrets,
  useHostCapabilities,
  useMfeEnvelope,
} from '@/modules/mfe';
import { resetTokenStore, setTokens } from '@/modules/api';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  resetTokenStore();
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
    withContext
      ? buildHostContext({ permissions: ['staff:manage'] })
      : undefined,
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
    expect(screen.getByTestId('envelope').textContent).toContain(
      'staff:manage',
    );
    expect(screen.getByTestId('envelope').textContent).not.toContain(
      'todo:read',
    );
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

  it('ignores POS-token navigation off the counter', async () => {
    setTokens({
      accessToken: 'pos-access',
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'pos',
      accessTokenExpiresAt: null,
    });
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    function PosNavProbe() {
      const caps = useHostCapabilities();
      const location = useLocation();
      return (
        <div>
          <span data-testid="pos-path">{location.pathname}</span>
          <button
            type="button"
            data-testid="pos-nav-away"
            onClick={() => caps.navigate?.('/analytics')}
          >
            away
          </button>
          <button
            type="button"
            data-testid="pos-nav-login"
            onClick={() => caps.navigate?.('/pos-login')}
          >
            pin
          </button>
        </div>
      );
    }
    render(
      <MemoryRouter initialEntries={['/pos']}>
        <Routes>
          <Route path="/pos" element={<PosNavProbe />} />
          <Route
            path="/pos-login"
            element={<p data-testid="pos-login">pin</p>}
          />
          <Route path="/analytics" element={<p>analytics</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await user.click(screen.getByTestId('pos-nav-away'));
    expect(screen.getByTestId('pos-path').textContent).toBe('/pos');
    await user.click(screen.getByTestId('pos-nav-login'));
    expect(screen.getByTestId('pos-login')).toBeTruthy();
  });

  it('rejects non-POS APIs for a POS token without fetching', async () => {
    setTokens({
      accessToken: 'pos-access',
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'pos',
      accessTokenExpiresAt: null,
    });
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    function PosApiProbe() {
      const caps = useHostCapabilities();
      return (
        <button
          type="button"
          data-testid="pos-api"
          onClick={() => {
            void caps.api
              ?.request({ path: '/api/v1/pharmacy/settings' })
              .then((res) => {
                const el = document.querySelector(
                  '[data-testid="pos-api-code"]',
                );
                if (el) el.textContent = String(res.code);
              });
          }}
        >
          go
        </button>
      );
    }
    render(
      <MemoryRouter>
        <PosApiProbe />
        <span data-testid="pos-api-code" />
      </MemoryRouter>,
    );
    await user.click(screen.getByTestId('pos-api'));
    await waitFor(() => {
      expect(screen.getByTestId('pos-api-code').textContent).toBe(
        'POS_TOKEN_RESTRICTED',
      );
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows POS-token requests on the POS prefix', async () => {
    setTokens({
      accessToken: 'pos-access',
      refreshToken: null,
      tokenType: 'Bearer',
      tokenScope: 'pos',
      accessTokenExpiresAt: null,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ success: true, data: { cart_id: '1' } }),
            {
              status: 200,
            },
          ),
      ),
    );
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    function PosOkProbe() {
      const caps = useHostCapabilities();
      return (
        <button
          type="button"
          data-testid="pos-ok"
          onClick={() => {
            void caps.api
              ?.request({ path: '/api/v1/pharmacy/pos/cart' })
              .then((res) => {
                const el = document.querySelector(
                  '[data-testid="pos-ok-status"]',
                );
                if (el) el.textContent = String(res.status);
              });
          }}
        >
          go
        </button>
      );
    }
    render(
      <MemoryRouter>
        <PosOkProbe />
        <span data-testid="pos-ok-status" />
      </MemoryRouter>,
    );
    await user.click(screen.getByTestId('pos-ok'));
    await waitFor(() => {
      expect(screen.getByTestId('pos-ok-status').textContent).toBe('200');
    });
  });
});
