import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TodosPage } from '@/pages/TodosPage';
import { SessionProvider } from '@/session/SessionProvider';
import { SESSION_FIXTURES } from '@/session/session';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('TodosPage host envelope', () => {
  it('invokes host callbacks from a fake remote', async () => {
    vi.stubEnv('VITE_REMOTE_TODO_URL', 'https://example.test/mf-manifest.json');
    render(
      <MemoryRouter>
        <SessionProvider session={SESSION_FIXTURES['owner-free']}>
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
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('fake-todo')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('host-todo-count')).toHaveTextContent('2');
    });
  });
});
