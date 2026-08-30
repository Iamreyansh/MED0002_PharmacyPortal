import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupportFeatureData } from '@medmate/support-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { hostApi } from '@/modules/api';
import { SupportIndexRedirect, SupportRemotePage } from '@/modules/support';
import { SessionProvider, SESSION_FIXTURES } from '@/modules/session';
import { ToastProvider } from '@/modules/shell';

const TICKET_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function wrap(
  ui: ReactElement,
  path: string,
  session = SESSION_FIXTURES['owner-free'],
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider session={session}>
        <ToastProvider>
          <Routes>
            <Route path="/support" element={<SupportIndexRedirect />} />
            <Route path="/support/new" element={ui} />
            <Route path="/support/tickets/:id" element={ui} />
            <Route path="/help" element={ui} />
            <Route path="/help/articles/:id" element={ui} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function ticketStub(): RemoteImporter {
  return async () => ({
    default: function TicketStub(props: Record<string, unknown>) {
      const data = props.data as { feature: SupportFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-use">{String(data.feature.canUseTickets)}</p>
          <p data-testid="ticket-id">{data.feature.ticketId ?? ''}</p>
          <p data-testid="token-scope">{data.feature.tokenScope ?? ''}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'ticket-new',
                  action: 'create',
                  values: { subject: 'Printer', category: 'PHARMACY' },
                })
                .then((result) => {
                  setLog(
                    result.ok
                      ? (result.ticketId ?? 'ok')
                      : (result.code ?? 'fail'),
                  );
                });
            }}
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'ticket-detail',
                  action: 'load',
                  values: { ticketId: data.feature.ticketId ?? '' },
                })
                .then((result) => {
                  setLog(
                    result.ok
                      ? (result.ticket?.id ?? 'ok')
                      : (result.code ?? 'fail'),
                  );
                });
            }}
          >
            Load ticket
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function helpStub(): RemoteImporter {
  return async () => ({
    default: function HelpStub(props: Record<string, unknown>) {
      const data = props.data as { feature: SupportFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="authenticated">
            {String(data.feature.authenticated)}
          </p>
          <p data-testid="article-id">{data.feature.articleId ?? ''}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({ screen: 'help', action: 'load' })
                .then((result) => {
                  setLog(
                    result.ok
                      ? String(result.articles?.length ?? 0)
                      : (result.code ?? 'fail'),
                  );
                });
            }}
          >
            Load help
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

describe('SupportRemotePage', () => {
  it('creates and loads tickets for owner and staff', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 201,
      data: { id: TICKET_ID, subject: 'Printer' },
    });
    wrap(
      <SupportRemotePage screen="ticket-new" loadRemote={ticketStub()} />,
      '/support/new',
    );
    expect(screen.getByTestId('support-ticket-new-page')).toBeTruthy();
    expect(await screen.findByTestId('can-use')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(TICKET_ID);
    expect(request).toHaveBeenCalled();
    cleanup();
    wrap(
      <SupportRemotePage screen="ticket-detail" loadRemote={ticketStub()} />,
      `/support/tickets/${TICKET_ID}`,
      SESSION_FIXTURES['staff-active'],
    );
    expect(await screen.findByTestId('ticket-id')).toHaveTextContent(TICKET_ID);
    await user.click(screen.getByRole('button', { name: 'Load ticket' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(TICKET_ID);
  });

  it('blocks POS without calling Core and maps not-found', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request');
    wrap(
      <SupportRemotePage screen="ticket-new" loadRemote={ticketStub()} />,
      '/support/new',
      SESSION_FIXTURES['pos-scope'],
    );
    expect(await screen.findByTestId('can-use')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(
      'POS_TOKEN_RESTRICTED',
    );
    expect(request).not.toHaveBeenCalled();
    cleanup();
    wrap(
      <SupportRemotePage screen="ticket-detail" loadRemote={ticketStub()} />,
      `/support/tickets/${TICKET_ID}`,
      SESSION_FIXTURES.unauthenticated,
    );
    await user.click(
      await screen.findByRole('button', { name: 'Load ticket' }),
    );
    expect(await screen.findByTestId('log')).toHaveTextContent('FORBIDDEN');
    expect(request).not.toHaveBeenCalled();
    cleanup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 404,
      data: undefined as never,
      code: 'TICKET_NOT_FOUND',
    });
    wrap(
      <SupportRemotePage screen="ticket-detail" loadRemote={ticketStub()} />,
      `/support/tickets/${TICKET_ID}`,
    );
    await user.click(
      await screen.findByRole('button', { name: 'Load ticket' }),
    );
    expect(await screen.findByTestId('log')).toHaveTextContent(
      'TICKET_NOT_FOUND',
    );
  });

  it('loads public help for anonymous visitors and uses a configured URL', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { articles: [{ id: 'hours' }] },
    });
    wrap(
      <SupportRemotePage screen="help" loadRemote={helpStub()} />,
      '/help',
      SESSION_FIXTURES.unauthenticated,
    );
    expect(await screen.findByTestId('authenticated')).toHaveTextContent(
      'false',
    );
    await user.click(screen.getByRole('button', { name: 'Load help' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('1');
    cleanup();
    wrap(<SupportRemotePage screen="help" />, '/help');
    expect(await screen.findByTestId('support-help-page')).toBeTruthy();
    cleanup();
    vi.stubEnv(
      'VITE_REMOTE_SUPPORT_URL',
      'https://example.test/mf-manifest.json',
    );
    wrap(
      <SupportRemotePage screen="help-article" loadRemote={helpStub()} />,
      '/help/articles/hours',
    );
    expect(await screen.findByTestId('article-id')).toHaveTextContent('hours');
    cleanup();
    wrap(
      <SupportRemotePage screen="ticket-detail" loadRemote={ticketStub()} />,
      '/support/new',
    );
    expect(await screen.findByTestId('ticket-id')).toHaveTextContent('');
    cleanup();
    wrap(
      <SupportRemotePage screen="help-article" loadRemote={helpStub()} />,
      '/help',
    );
    expect(await screen.findByTestId('article-id')).toHaveTextContent('');
  });

  it('redirects /support to /support/new', () => {
    wrap(
      <SupportRemotePage screen="ticket-new" loadRemote={ticketStub()} />,
      '/support',
    );
    expect(screen.getByTestId('support-ticket-new-page')).toBeTruthy();
  });
});
