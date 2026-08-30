import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AnalyticsFeatureData } from '@medmate/analytics-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { hostApi, resetTelemetry, subscribeTelemetry } from '@/modules/api';
import { AnalyticsRemotePage } from '@/modules/analytics';
import { SessionProvider, SESSION_FIXTURES } from '@/modules/session';
import { ToastProvider } from '@/modules/shell';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  resetTelemetry();
});

function wrap(
  ui: ReactElement,
  session = SESSION_FIXTURES['owner-retail-pro'],
) {
  return render(
    <MemoryRouter initialEntries={['/analytics']}>
      <SessionProvider session={session}>
        <ToastProvider>
          <Routes>
            <Route path="/analytics" element={ui} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function analyticsStub(): RemoteImporter {
  return async () => ({
    default: function AnalyticsStub(props: Record<string, unknown>) {
      const data = props.data as { feature: AnalyticsFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="locked">{String(data.feature.analyticsLocked)}</p>
          <p data-testid="can-gst">{String(data.feature.canViewGst)}</p>
          <p data-testid="can-favorite">{String(data.feature.canFavorite)}</p>
          <p data-testid="role">{data.feature.role ?? ''}</p>
          <p data-testid="plan">{data.feature.plan ?? ''}</p>
          <p data-testid="token-scope">{data.feature.tokenScope ?? ''}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'analytics',
                  action: 'loadOverview',
                  values: { period: '30D' },
                })
                .then((result) => {
                  setLog(
                    result.ok
                      ? String(result.overview?.financials?.units_sold ?? 0)
                      : (result.code ?? 'fail'),
                  );
                });
            }}
          >
            Load overview
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'analytics',
                  action: 'loadGst',
                  values: { period: 'FY' },
                })
                .then((result) => {
                  setLog(result.ok ? 'gst' : (result.code ?? 'fail'));
                });
            }}
          >
            Load GST
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'analytics',
                  action: 'favorite',
                  values: { reportId: 'DAYBOOK', is_favorite: true },
                })
                .then((result) => {
                  setLog(result.ok ? 'fav' : (result.code ?? 'fail'));
                });
            }}
          >
            Favorite
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

describe('AnalyticsRemotePage', () => {
  it('loads overview for a Growth owner', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { financials: { units_sold: 12 } },
    });
    wrap(<AnalyticsRemotePage loadRemote={analyticsStub()} />);
    expect(screen.getByTestId('analytics-analytics-page')).toBeTruthy();
    expect(await screen.findByTestId('locked')).toHaveTextContent('false');
    expect(screen.getByTestId('can-gst')).toHaveTextContent('true');
    expect(screen.getByTestId('can-favorite')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Load overview' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('12');
  });

  it('locks Free without calling Core and tracks the lock', async () => {
    const events: string[] = [];
    subscribeTelemetry((event) => events.push(event));
    const request = vi.spyOn(hostApi, 'request');
    wrap(
      <AnalyticsRemotePage loadRemote={analyticsStub()} />,
      SESSION_FIXTURES['owner-free'],
    );
    expect(await screen.findByTestId('locked')).toHaveTextContent('true');
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Load overview' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(
      'PLAN_FEATURE_LOCKED',
    );
    expect(request).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(events).toContain('plan_lock_shown');
    });
  });

  it('blocks staff GST and favorite without calling Core', async () => {
    const user = userEvent.setup();
    const request = vi.spyOn(hostApi, 'request');
    wrap(<AnalyticsRemotePage loadRemote={analyticsStub()} />, {
      ...SESSION_FIXTURES['staff-active'],
      plan: 'RETAIL_PRO',
    });
    expect(await screen.findByTestId('locked')).toHaveTextContent('false');
    expect(screen.getByTestId('can-gst')).toHaveTextContent('false');
    expect(screen.getByTestId('can-favorite')).toHaveTextContent('false');
    await user.click(screen.getByRole('button', { name: 'Load GST' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('FORBIDDEN');
    await user.click(screen.getByRole('button', { name: 'Favorite' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('FORBIDDEN');
    expect(request).not.toHaveBeenCalled();
  });

  it('blocks POS without calling Core', async () => {
    const request = vi.spyOn(hostApi, 'request');
    wrap(
      <AnalyticsRemotePage loadRemote={analyticsStub()} />,
      SESSION_FIXTURES['pos-scope'],
    );
    expect(await screen.findByTestId('token-scope')).toHaveTextContent('pos');
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Load overview' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(
      'POS_TOKEN_RESTRICTED',
    );
    expect(request).not.toHaveBeenCalled();
  });

  it('keeps Pro FORBIDDEN as forbidden and tracks Core upgrade codes', async () => {
    const events: string[] = [];
    subscribeTelemetry((event) => events.push(event));
    vi.spyOn(hostApi, 'request')
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        data: undefined as never,
        code: 'FORBIDDEN',
        message: 'No',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        data: undefined as never,
        code: 'PLAN_UPGRADE_REQUIRED',
        message: 'Upgrade',
      });
    wrap(<AnalyticsRemotePage loadRemote={analyticsStub()} />);
    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Load overview' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('FORBIDDEN');
    expect(events).not.toContain('plan_lock_shown');
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Load overview' }));
    expect(await screen.findByTestId('log')).toHaveTextContent(
      'PLAN_UPGRADE_REQUIRED',
    );
    await waitFor(() => {
      expect(events).toContain('plan_lock_shown');
    });
  });

  it('toasts a successful favorite without PHI', async () => {
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { report_id: 'DAYBOOK', is_favorite: true },
    });
    wrap(<AnalyticsRemotePage loadRemote={analyticsStub()} />);
    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Favorite' }));
    expect(await screen.findByTestId('log')).toHaveTextContent('fav');
    expect(screen.getByTestId('toast')).toHaveTextContent('Favorite updated');
    expect(screen.getByTestId('toast').textContent).not.toMatch(
      /DAYBOOK|GSTIN/i,
    );
  });

  it('renders a degraded outlet and uses a configured remote URL', async () => {
    wrap(<AnalyticsRemotePage />);
    expect(await screen.findByTestId('analytics-analytics-page')).toBeTruthy();
    cleanup();
    vi.stubEnv(
      'VITE_REMOTE_ANALYTICS_URL',
      'https://example.test/mf-manifest.json',
    );
    wrap(
      <AnalyticsRemotePage loadRemote={analyticsStub()} />,
      SESSION_FIXTURES.unauthenticated,
    );
    expect(await screen.findByTestId('role')).toHaveTextContent('');
    expect(screen.getByTestId('can-gst')).toHaveTextContent('false');
  });
});
