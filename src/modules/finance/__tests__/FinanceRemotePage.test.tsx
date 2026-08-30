import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FinanceFeatureData } from '@medmate/finance-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { hostApi } from '@/modules/api';
import { FinanceRemotePage } from '@/modules/finance';
import { SessionProvider, SESSION_FIXTURES } from '@/modules/session';
import { ToastProvider } from '@/modules/shell';

const SETTLEMENT_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function wrap(
  ui: ReactElement,
  path: string,
  session = SESSION_FIXTURES['owner-retail-pro'],
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider session={session}>
        <ToastProvider>
          <Routes>
            <Route path="/finance/settlements" element={ui} />
            <Route path="/finance/settlements/:id" element={ui} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function listStub(): RemoteImporter {
  return async () => ({
    default: function ListStub(props: Record<string, unknown>) {
      const data = props.data as { feature: FinanceFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-view">
            {String(data.feature.canViewSettlements)}
          </p>
          <p data-testid="settlement-id">{data.feature.settlementId ?? ''}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'settlements',
                  action: 'load',
                  values: { page: 1, limit: 20 },
                })
                .then((result) => {
                  setLog(
                    result.ok
                      ? String(result.settlements?.length ?? 0)
                      : (result.code ?? 'fail'),
                  );
                });
            }}
          >
            Load list
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function detailStub(): RemoteImporter {
  return async () => ({
    default: function DetailStub(props: Record<string, unknown>) {
      const data = props.data as { feature: FinanceFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-view">
            {String(data.feature.canViewSettlements)}
          </p>
          <p data-testid="settlement-id">{data.feature.settlementId ?? ''}</p>
          <p data-testid="token-scope">{data.feature.tokenScope ?? ''}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'settlement-detail',
                  action: 'load',
                  values: { settlementId: data.feature.settlementId ?? '' },
                })
                .then((result) => {
                  setLog(
                    result.ok
                      ? (result.settlement?.settlement_id ?? 'ok')
                      : (result.code ?? 'fail'),
                  );
                });
            }}
          >
            Load detail
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

describe('FinanceRemotePage', () => {
  it('loads the owner list on Free', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { settlements: [{ settlement_id: SETTLEMENT_ID }] },
      details: { has_next: true },
    });
    wrap(
      <FinanceRemotePage screen="settlements" loadRemote={listStub()} />,
      '/finance/settlements',
      SESSION_FIXTURES['owner-free'],
    );
    expect(screen.getByTestId('finance-settlements-page')).toBeTruthy();
    expect(await screen.findByTestId('can-view')).toHaveTextContent('true');
    expect(screen.getByTestId('settlement-id')).toHaveTextContent('');
    await user.click(screen.getByRole('button', { name: 'Load list' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('1');
  });

  it('loads detail for an owner and maps not-found', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request').mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: { settlement_id: SETTLEMENT_ID, net_payable: 100 },
    });
    wrap(
      <FinanceRemotePage
        screen="settlement-detail"
        loadRemote={detailStub()}
      />,
      `/finance/settlements/${SETTLEMENT_ID}`,
    );
    expect(screen.getByTestId('finance-settlement-detail-page')).toBeTruthy();
    expect(await screen.findByTestId('settlement-id')).toHaveTextContent(
      SETTLEMENT_ID,
    );
    await user.click(screen.getByRole('button', { name: 'Load detail' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(SETTLEMENT_ID);
    expect(request).toHaveBeenCalled();
    cleanup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: false,
      status: 404,
      data: undefined as never,
      code: 'SETTLEMENT_NOT_FOUND',
      message: 'Missing',
    });
    wrap(
      <FinanceRemotePage
        screen="settlement-detail"
        loadRemote={detailStub()}
      />,
      `/finance/settlements/${SETTLEMENT_ID}`,
    );
    await user.click(
      await screen.findByRole('button', { name: 'Load detail' }),
    );
    expect(await screen.findByTestId('log')).toHaveTextContent(
      'SETTLEMENT_NOT_FOUND',
    );
  });

  it('blocks staff and POS without calling Core', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request');
    wrap(
      <FinanceRemotePage screen="settlements" loadRemote={listStub()} />,
      '/finance/settlements',
      SESSION_FIXTURES['staff-active'],
    );
    expect(await screen.findByTestId('can-view')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Load list' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('FORBIDDEN');
    expect(request).not.toHaveBeenCalled();
    cleanup();
    wrap(
      <FinanceRemotePage
        screen="settlement-detail"
        loadRemote={detailStub()}
      />,
      `/finance/settlements/${SETTLEMENT_ID}`,
      SESSION_FIXTURES['pos-scope'],
    );
    expect(await screen.findByTestId('can-view')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Load detail' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(
      'POS_TOKEN_RESTRICTED',
    );
    expect(request).not.toHaveBeenCalled();
  });

  it('renders a degraded outlet and uses a configured remote URL', async () => {
    wrap(<FinanceRemotePage screen="settlements" />, '/finance/settlements');
    expect(await screen.findByTestId('finance-settlements-page')).toBeTruthy();
    cleanup();
    vi.stubEnv(
      'VITE_REMOTE_FINANCE_URL',
      'https://example.test/mf-manifest.json',
    );
    wrap(
      <FinanceRemotePage
        screen="settlement-detail"
        loadRemote={detailStub()}
      />,
      '/finance/settlements',
      SESSION_FIXTURES.unauthenticated,
    );
    expect(await screen.findByTestId('settlement-id')).toHaveTextContent('');
    expect(screen.getByTestId('can-view')).toHaveTextContent('false');
  });
});
