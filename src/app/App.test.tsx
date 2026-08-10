import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import {
  MFE_CONTRACT_VERSION,
  RemoteErrorBoundary,
  RemoteLoader,
  buildFederationRemotes,
  getRemoteUrl,
  listConfiguredRemotes,
} from '@/mfe';
import { HomePage } from '@/pages/HomePage';
import { TodosPage } from '@/pages/TodosPage';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('remotes.config', () => {
  it('builds remotes from env', () => {
    const remotes = buildFederationRemotes({
      VITE_REMOTE_TODO_URL:
        'https://todo.mfe.nammamedmate.com/mf-manifest.json',
      VITE_REMOTE_EMPTY_URL: '',
      IGNORED: 'x',
    });
    expect(remotes.todo?.entry).toContain('todo.mfe');
    expect(Object.keys(remotes)).toEqual(['todo']);
  });

  it('reads runtime remote urls', () => {
    vi.stubEnv('VITE_REMOTE_TODO_URL', 'https://example.test/mf-manifest.json');
    expect(getRemoteUrl('todo')).toBe('https://example.test/mf-manifest.json');
    expect(listConfiguredRemotes()).toContain('todo');
  });

  it('returns undefined for missing remote urls', () => {
    vi.stubEnv('VITE_REMOTE_TODO_URL', '');
    expect(getRemoteUrl('todo')).toBeUndefined();
  });
});

describe('RemoteLoader', () => {
  it('shows missing remote when unset', () => {
    vi.stubEnv('VITE_REMOTE_TODO_URL', '');
    render(<RemoteLoader remote="todo" module="./Mfe" />);
    expect(screen.getByTestId('remote-missing')).toBeTruthy();
  });

  it('renders loaded remote with data props', async () => {
    vi.stubEnv('VITE_REMOTE_TODO_URL', 'https://example.test/mf-manifest.json');
    render(
      <RemoteLoader
        remote="todo"
        module="./Mfe"
        componentProps={{ data: { hello: 'world' } }}
        loadRemote={async () => ({
          default: function Fake(props: Record<string, unknown>) {
            const data = props.data as { hello: string };
            return <div data-testid="fake-remote">{data.hello}</div>;
          },
        })}
      />,
    );
    expect(await screen.findByTestId('fake-remote')).toHaveTextContent('world');
  });

  it('shows error fallback when importer fails', async () => {
    vi.stubEnv('VITE_REMOTE_TODO_URL', 'https://example.test/mf-manifest.json');
    render(
      <RemoteLoader
        remote="todo"
        module="./Mfe"
        loadRemote={async () => {
          throw new Error('boom');
        }}
      />,
    );
    expect(await screen.findByTestId('remote-error')).toBeTruthy();
  });

  it('uses custom error fallback', async () => {
    vi.stubEnv('VITE_REMOTE_TODO_URL', 'https://example.test/mf-manifest.json');
    render(
      <RemoteLoader
        remote="todo"
        module="./Mfe"
        errorFallback={<div data-testid="custom-error">custom</div>}
        loadRemote={async () => ({
          default: function Broken() {
            throw new Error('render fail');
          },
        })}
      />,
    );
    expect(await screen.findByTestId('custom-error')).toBeTruthy();
  });

  it('reports boundary errors via onError', () => {
    const onError = vi.fn();
    function Boom(): never {
      throw new Error('boundary');
    }
    render(
      <RemoteErrorBoundary
        fallback={<div data-testid="boundary">boundary</div>}
        onError={onError}
      >
        <Boom />
      </RemoteErrorBoundary>,
    );
    expect(screen.getByTestId('boundary')).toBeTruthy();
    expect(onError).toHaveBeenCalled();
  });
});

describe('pages', () => {
  it('shows none when remotes are not configured', () => {
    vi.stubEnv('VITE_REMOTE_TODO_URL', '');
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('configured-remotes')).toHaveTextContent('none');
  });

  it('invokes host callbacks from a fake remote', async () => {
    vi.stubEnv('VITE_REMOTE_TODO_URL', 'https://example.test/mf-manifest.json');
    render(
      <MemoryRouter>
        <TodosPage
          loadRemote={async () => ({
            default: function Fake(props: Record<string, unknown>) {
              const data = props.data as {
                feature: { onChange?: (items: unknown[]) => void };
                capabilities?: {
                  navigate?: (path: string) => void;
                  telemetry?: { track: (event: string) => void };
                };
              };
              useEffect(() => {
                data.feature.onChange?.([
                  { id: '1', title: 'a', completed: false },
                  { id: '2', title: 'b', completed: true },
                ]);
                data.capabilities?.navigate?.('/demo');
                data.capabilities?.telemetry?.track('loaded');
              }, [data]);
              return <div data-testid="fake-todo">fake</div>;
            },
          })}
        />
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('fake-todo')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('host-todo-count')).toHaveTextContent('2');
    });
  });
});

describe('App routes', () => {
  it('renders home and navigates to todos', async () => {
    const user = userEvent.setup();
    vi.stubEnv('VITE_REMOTE_TODO_URL', 'https://example.test/mf-manifest.json');
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: 'Pharmacy Portal' }),
    ).toBeTruthy();
    expect(screen.getByTestId('configured-remotes')).toHaveTextContent('todo');
    expect(MFE_CONTRACT_VERSION).toBe('1.0.0');
    await user.click(screen.getByRole('link', { name: 'Open Todo MFE' }));
  });

  it('renders todos page', async () => {
    vi.stubEnv('VITE_REMOTE_TODO_URL', 'https://example.test/mf-manifest.json');
    render(
      <MemoryRouter initialEntries={['/todos']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Todos' })).toBeTruthy();
    expect(screen.getByTestId('host-todo-count')).toHaveTextContent('1');
  });
});
