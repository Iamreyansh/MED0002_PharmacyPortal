import { MFE_CONTRACT_VERSION, type MfeDataEnvelope } from '@medmate/contracts';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MfeOutlet, withTimeout } from '@/mfe/MfeOutlet';
import type { RemoteImporter } from '@medmate/host-kit';

afterEach(() => {
  cleanup();
});

function envelope(overrides: Partial<MfeDataEnvelope> = {}): MfeDataEnvelope {
  return {
    contractVersion: MFE_CONTRACT_VERSION,
    context: {
      hostId: 'pharmacy-portal',
      locale: 'en-IN',
      permissions: [],
    },
    feature: {},
    capabilities: {
      telemetry: { track: vi.fn() },
    },
    ...overrides,
  };
}

describe('withTimeout', () => {
  it('resolves, rejects, and times out', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 50)).resolves.toBe('ok');
    await expect(
      withTimeout(Promise.reject(new Error('nope')), 50),
    ).rejects.toThrow('nope');
    await expect(withTimeout(new Promise(() => undefined), 10)).rejects.toThrow(
      'Remote load timed out',
    );
  });
});

describe('MfeOutlet', () => {
  it('refuses an unsupported contract version', async () => {
    const onReload = vi.fn();
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MfeOutlet
          remote="pos"
          module="./Mfe"
          remoteUrl="https://example.test/mf-manifest.json"
          data={envelope({
            contractVersion: '0.0.1' as typeof MFE_CONTRACT_VERSION,
          })}
          onReload={onReload}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('contract-mismatch')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Reload' }));
    expect(onReload).toHaveBeenCalled();
  });

  it('shows remote-error, tracks, and retries a failed load', async () => {
    const user = userEvent.setup();
    const track = vi.fn();
    let fail = true;
    const loadRemote: RemoteImporter = async () => {
      if (fail) {
        throw new Error('404 manifest');
      }
      return {
        default: function Ok() {
          return <div data-testid="remote-ok">ok</div>;
        },
      };
    };
    render(
      <MemoryRouter>
        <MfeOutlet
          remote="pos"
          module="./Mfe"
          remoteUrl="https://example.test/mf-manifest.json"
          data={envelope({
            capabilities: { telemetry: { track } },
          })}
          loadRemote={loadRemote}
        />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('remote-error')).toBeTruthy();
    expect(track).toHaveBeenCalledWith('mfe_load_error', { remote: 'pos' });
    fail = false;
    screen.getByRole('button', { name: 'Retry' }).focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByTestId('remote-ok')).toBeTruthy();
  });

  it('isolates a thrown remote render', async () => {
    const loadRemote: RemoteImporter = async () => ({
      default: function Boom() {
        throw new Error('render failed');
      },
    });
    render(
      <MemoryRouter>
        <MfeOutlet
          remote="pos"
          module="./Mfe"
          remoteUrl="https://example.test/mf-manifest.json"
          data={envelope()}
          loadRemote={loadRemote}
        />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('remote-error')).toBeTruthy();
  });

  it('mounts a healthy remote with hostId pharmacy-portal', async () => {
    const loadRemote: RemoteImporter = async () => ({
      default: function Remote(props: Record<string, unknown>) {
        const data = props.data as MfeDataEnvelope;
        return <div data-testid="remote-ok">{data.context.hostId}</div>;
      },
    });
    render(
      <MemoryRouter>
        <MfeOutlet
          remote="pos"
          module="./Mfe"
          remoteUrl="https://example.test/mf-manifest.json"
          data={envelope()}
          loadRemote={loadRemote}
        />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('remote-ok')).toHaveTextContent(
      'pharmacy-portal',
    );
  });

  it('uses the default importer and skips telemetry when missing', async () => {
    render(
      <MemoryRouter>
        <MfeOutlet
          remote="pos"
          module="./Mfe"
          remoteUrl="https://example.test/mf-manifest.json"
          data={envelope({ capabilities: undefined })}
        />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('remote-error')).toBeTruthy();
  });

  it('handles a render throw when telemetry is omitted', async () => {
    const loadRemote: RemoteImporter = async () => ({
      default: function Boom() {
        throw new Error('render failed');
      },
    });
    render(
      <MemoryRouter>
        <MfeOutlet
          remote="pos"
          module="./Mfe"
          remoteUrl="https://example.test/mf-manifest.json"
          data={envelope({ capabilities: undefined })}
          loadRemote={loadRemote}
        />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('remote-error')).toBeTruthy();
  });

  it('shows missing remote UI when the URL is empty', () => {
    render(
      <MemoryRouter>
        <MfeOutlet
          remote="pos"
          module="./Mfe"
          remoteUrl=""
          data={envelope()}
          loadRemote={async () => ({
            default: function Ok() {
              return <div>ok</div>;
            },
          })}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('remote-missing')).toBeTruthy();
  });
});
