import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_HOST_CONTEXT,
  buildHostContext,
  useHostCapabilities,
  useMfeEnvelope,
} from '@/host';
import { setTokens } from '@/api/token-store';

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
});
