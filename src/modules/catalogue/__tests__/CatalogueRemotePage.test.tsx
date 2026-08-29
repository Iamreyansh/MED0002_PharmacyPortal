import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CatalogueFeatureData } from '@medmate/catalogue-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { CatalogueRemotePage } from '@/modules/catalogue';
import { SessionProvider, SESSION_FIXTURES } from '@/modules/session';
import { ToastProvider } from '@/modules/shell';
import { hostApi } from '@/modules/api';

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
            <Route path="/catalogue" element={ui} />
            <Route path="/catalogue/mapping" element={ui} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function searchStub(): RemoteImporter {
  return async () => ({
    default: function SearchStub(props: Record<string, unknown>) {
      const data = props.data as { feature: CatalogueFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-create">{String(data.feature.canCreate)}</p>
          <p data-testid="can-patch">{String(data.feature.canPatch)}</p>
          <p data-testid="role">{data.feature.role}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'search',
                  action: 'search',
                  values: { q: 'crocin' },
                })
                .then((result) => {
                  setLog(result.ok ? 'loaded' : (result.formError ?? 'fail'));
                });
            }}
          >
            Search
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function mappingStub(): RemoteImporter {
  return async () => ({
    default: function MappingStub(props: Record<string, unknown>) {
      const data = props.data as { feature: CatalogueFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="create-from">
            {data.feature.createFromMedicineId ?? ''}
          </p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'mapping',
                  action: 'create',
                  values: {
                    master_medicine_id: '11111111-2222-4333-8444-555555555555',
                    pharmacy_price: 20,
                    stock_quantity: 2,
                  },
                })
                .then((result) => {
                  setLog(result.ok ? 'created' : (result.formError ?? 'fail'));
                });
            }}
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature.onSubmit({
                screen: 'mapping',
                action: 'update',
                values: { mapping_id: 'map-1', pharmacy_price: 19 },
              });
            }}
          >
            Update
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature.onSubmit({
                screen: 'mapping',
                action: 'delete',
                values: { mapping_id: 'map-1' },
              });
            }}
          >
            Delete
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

describe('CatalogueRemotePage', () => {
  it('searches for owners and toasts mapping create', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { results: [{ medicine_id: 'm1', name: 'Crocin' }] },
    });
    wrap(
      <CatalogueRemotePage screen="search" loadRemote={searchStub()} />,
      '/catalogue',
    );
    expect(await screen.findByTestId('can-create')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('loaded');
    });

    cleanup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 201,
      data: { mapping_id: 'map-1' },
    });
    wrap(
      <CatalogueRemotePage screen="mapping" loadRemote={mappingStub()} />,
      '/catalogue/mapping?master_medicine_id=med-9',
    );
    expect(await screen.findByTestId('create-from')).toHaveTextContent('med-9');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Mapping created')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Update' }));
    expect(await screen.findByText('Mapping updated')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Mapping removed')).toBeTruthy();
  });

  it('builds an envelope when session ids are missing', async () => {
    wrap(
      <CatalogueRemotePage screen="search" loadRemote={searchStub()} />,
      '/catalogue',
      {
        ...SESSION_FIXTURES['owner-free'],
        pharmacyId: null,
        staffId: null,
      },
    );
    expect(await screen.findByTestId('can-create')).toBeTruthy();
  });

  it('disables writes when the session has no role', async () => {
    wrap(
      <CatalogueRemotePage screen="search" loadRemote={searchStub()} />,
      '/catalogue',
      SESSION_FIXTURES.unauthenticated,
    );
    expect(await screen.findByTestId('can-create')).toHaveTextContent('false');
    expect(screen.getByTestId('can-patch')).toHaveTextContent('false');
  });

  it('hides creates for staff', async () => {
    wrap(
      <CatalogueRemotePage screen="search" loadRemote={searchStub()} />,
      '/catalogue',
      SESSION_FIXTURES.cashier,
    );
    expect(await screen.findByTestId('can-create')).toHaveTextContent('false');
    expect(screen.getByTestId('can-patch')).toHaveTextContent('true');
    expect(screen.getByTestId('role')).toHaveTextContent('pharmacy_staff');
  });

  it('falls back when the remote is missing', async () => {
    wrap(<CatalogueRemotePage screen="search" />, '/catalogue');
    expect(await screen.findByTestId('catalogue-search-page')).toBeTruthy();
    expect(await screen.findByTestId('remote-missing')).toBeTruthy();
  });

  it('uses a configured remote URL when present', async () => {
    vi.stubEnv(
      'VITE_REMOTE_CATALOGUE_URL',
      'https://example.test/mf-manifest.json',
    );
    wrap(<CatalogueRemotePage screen="mapping" />, '/catalogue/mapping');
    expect(await screen.findByTestId('catalogue-mapping-page')).toBeTruthy();
    expect(await screen.findByTestId('remote-error')).toBeTruthy();
  });
});
