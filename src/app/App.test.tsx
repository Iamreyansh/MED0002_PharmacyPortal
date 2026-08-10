import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/app/App';
import { listRemoteRoutes } from '@/app/routes';
import { MFE_CONTRACT_VERSION } from '@medmate/contracts';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('App shell', () => {
  it('renders home and lists registry remotes', async () => {
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
    expect(listRemoteRoutes().map((r) => r.name)).toEqual(['todo']);
    await user.click(screen.getByRole('link', { name: 'Open Todos MFE' }));
  });

  it('renders todos page route from the registry', () => {
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

describe('TodosPage host envelope', () => {
  it('invokes host callbacks from a fake remote', async () => {
    vi.stubEnv('VITE_REMOTE_TODO_URL', 'https://example.test/mf-manifest.json');
    const { TodosPage } = await import('@/pages/TodosPage');
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
