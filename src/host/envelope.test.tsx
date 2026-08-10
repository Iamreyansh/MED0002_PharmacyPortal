import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_HOST_CONTEXT,
  buildHostContext,
  useHostCapabilities,
  useMfeEnvelope,
} from '@/host';

afterEach(() => {
  cleanup();
});

function CapProbe() {
  const caps = useHostCapabilities();
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          caps.navigate?.('/probed');
          void caps.api?.request({ path: '/noop' }).then((res) => {
            const el = document.querySelector('[data-testid="api-status"]');
            if (el) el.textContent = String(res.status);
          });
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
  });

  it('exposes router-backed navigate and stub capabilities', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <CapProbe />
      </MemoryRouter>,
    );
    await user.click(screen.getByTestId('nav-probe'));
    await waitFor(() => {
      expect(screen.getByTestId('api-status').textContent).toBe('501');
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
});
