import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SettingsFeatureData } from '@medmate/settings-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { SettingsRemotePage } from '@/modules/settings';
import { SessionProvider, SESSION_FIXTURES } from '@/modules/session';
import { ToastProvider } from '@/modules/shell';
import { hostApi } from '@/modules/api';
import { getStorefrontStatus } from '@/modules/settings/store/storefront-status';

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
            <Route path="/settings/profile" element={ui} />
            <Route path="/settings/storefront" element={ui} />
            <Route path="/settings/roles" element={ui} />
          </Routes>
        </ToastProvider>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function profileStub(): RemoteImporter {
  return async () => ({
    default: function ProfileStub(props: Record<string, unknown>) {
      const data = props.data as { feature: SettingsFeatureData };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-write">{String(data.feature.canWrite)}</p>
          <p data-testid="role">{data.feature.role}</p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({ screen: 'profile', action: 'load' })
                .then((result) => {
                  setLog(result.ok ? 'loaded' : (result.formError ?? 'fail'));
                });
            }}
          >
            Load
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature.onSubmit({
                screen: 'profile',
                action: 'save',
                values: { tagline: 'Open late' },
              });
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature.onSubmit({
                screen: 'profile',
                action: 'loadCompleteness',
              });
            }}
          >
            Completeness
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature.onSubmit({
                screen: 'profile',
                action: 'saveTax',
                values: { gstin: '29AABPP1234F1Z5' },
              });
            }}
          >
            Tax
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature.onSubmit({
                screen: 'profile',
                action: 'loadBank',
              });
            }}
          >
            Bank
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature.onSubmit({
                screen: 'profile',
                action: 'saveBank',
                values: {
                  account_holder: 'Priya',
                  bank_name: 'HDFC',
                  account_number: '123456789012',
                  ifsc_code: 'HDFC0001234',
                  account_type: 'CURRENT',
                },
              });
            }}
          >
            Save bank
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature.onSubmit({
                screen: 'profile',
                action: 'verifyContact',
                values: { channel: 'PHONE', otp: '123456' },
              });
            }}
          >
            Verify
          </button>
          <button
            type="button"
            onClick={() => {
              void data.feature.onSubmit({
                screen: 'profile',
                action: 'uploadLogo',
                values: {
                  file: new File(['png'], 'shop.png', { type: 'image/png' }),
                },
              });
            }}
          >
            Logo
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function rolesStub(): RemoteImporter {
  return async () => ({
    default: function RolesStub(props: Record<string, unknown>) {
      const data = props.data as {
        feature: SettingsFeatureData;
        context: { permissions: string[] };
      };
      const [log, setLog] = useState('');
      return (
        <div>
          <p data-testid="can-write">{String(data.feature.canWrite)}</p>
          <p data-testid="can-edit">
            {String(data.feature.canEditPermissions)}
          </p>
          <p data-testid="envelope-perms">
            {data.context.permissions.join(',')}
          </p>
          <button
            type="button"
            onClick={() => {
              void data.feature
                .onSubmit({
                  screen: 'roles',
                  action: 'create',
                  values: {
                    name: 'night_shift',
                    display_name: 'Night Shift',
                    permissions: ['orders:read'],
                  },
                })
                .then((result) => {
                  setLog(result.ok ? 'created' : (result.formError ?? 'fail'));
                });
            }}
          >
            Create
          </button>
          <p data-testid="log">{log}</p>
        </div>
      );
    },
  });
}

function storefrontStub(): RemoteImporter {
  return async () => ({
    default: function StorefrontStub(props: Record<string, unknown>) {
      const data = props.data as { feature: SettingsFeatureData };
      return (
        <button
          type="button"
          onClick={() => {
            void data.feature.onSubmit({
              screen: 'storefront',
              action: 'save',
              values: { is_online: false },
            });
          }}
        >
          Offline
        </button>
      );
    },
  });
}

describe('SettingsRemotePage', () => {
  it('loads profile and toasts owner writes', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockImplementation(async (input) => {
      if (input.path.endsWith('/profile') && input.method === 'GET') {
        return {
          ok: true,
          status: 200,
          data: { business_name: 'Shop', is_online: true },
        };
      }
      return { ok: true, status: 200, data: {} };
    });
    wrap(
      <SettingsRemotePage screen="profile" loadRemote={profileStub()} />,
      '/settings/profile',
    );
    expect(await screen.findByTestId('settings-profile-page')).toBeTruthy();
    expect(await screen.findByTestId('can-write')).toHaveTextContent('true');
    await user.click(screen.getByRole('button', { name: 'Load' }));
    await waitFor(() => {
      expect(screen.getByTestId('log').textContent).toBe('loaded');
    });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'Completeness' }));
    await user.click(screen.getByRole('button', { name: 'Tax' }));
    await user.click(screen.getByRole('button', { name: 'Bank' }));
    await user.click(screen.getByRole('button', { name: 'Save bank' }));
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    await user.click(screen.getByRole('button', { name: 'Logo' }));
    await waitFor(() => {
      expect(
        screen.getAllByTestId('toast').map((el) => el.textContent),
      ).toEqual(
        expect.arrayContaining([
          'Profile saved',
          'Tax details saved',
          'Bank account submitted',
          'Contact verified',
          'Logo uploaded',
        ]),
      );
    });
  });

  it('marks staff as read-only', async () => {
    wrap(
      <SettingsRemotePage screen="profile" loadRemote={profileStub()} />,
      '/settings/profile',
      SESSION_FIXTURES.cashier,
    );
    expect(await screen.findByTestId('can-write')).toHaveTextContent('false');
    expect(screen.getByTestId('role').textContent).toBe('pharmacy_staff');
  });

  it('patches storefront and shows the header chip source', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 200,
      data: { is_online: false, admin_forced_offline: false },
    });
    wrap(
      <SettingsRemotePage screen="storefront" loadRemote={storefrontStub()} />,
      '/settings/storefront',
    );
    expect(await screen.findByTestId('settings-storefront-page')).toBeTruthy();
    await user.click(await screen.findByRole('button', { name: 'Offline' }));
    await waitFor(() => {
      expect(getStorefrontStatus().isOnline).toBe(false);
      expect(screen.getByTestId('toast')).toHaveTextContent(
        'Storefront updated',
      );
    });
  });

  it('falls back when session has no pharmacy or staff id', async () => {
    wrap(
      <SettingsRemotePage screen="profile" />,
      '/settings/profile',
      SESSION_FIXTURES.unauthenticated,
    );
    expect(await screen.findByTestId('settings-profile-page')).toBeTruthy();
    expect(await screen.findByTestId('remote-missing')).toBeTruthy();
  });

  it('uses a configured remote URL when present', async () => {
    vi.stubEnv(
      'VITE_REMOTE_SETTINGS_URL',
      'https://example.test/mf-manifest.json',
    );
    wrap(<SettingsRemotePage screen="storefront" />, '/settings/storefront');
    expect(await screen.findByTestId('settings-storefront-page')).toBeTruthy();
    expect(await screen.findByTestId('remote-error')).toBeTruthy();
  });

  it('toasts role creates and exposes permission flags', async () => {
    const user = userEvent.setup();
    vi.spyOn(hostApi, 'request').mockResolvedValue({
      ok: true,
      status: 201,
      data: {
        id: 'role-1',
        name: 'night_shift',
        display_name: 'Night Shift',
        is_system: false,
      },
    });
    wrap(
      <SettingsRemotePage screen="roles" loadRemote={rolesStub()} />,
      '/settings/roles',
    );
    expect(await screen.findByTestId('settings-roles-page')).toBeTruthy();
    expect(await screen.findByTestId('can-write')).toHaveTextContent('true');
    expect(screen.getByTestId('can-edit')).toHaveTextContent('true');
    expect(screen.getByTestId('envelope-perms').textContent).not.toContain(
      'todo:read',
    );
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByTestId('log')).toHaveTextContent('created');
      expect(screen.getByTestId('toast')).toHaveTextContent('Role created');
    });
  });

  it('lets staff with staff:manage edit permissions but not create', async () => {
    wrap(
      <SettingsRemotePage screen="roles" loadRemote={rolesStub()} />,
      '/settings/roles',
      SESSION_FIXTURES['staff-active'],
    );
    expect(await screen.findByTestId('can-write')).toHaveTextContent('false');
    expect(screen.getByTestId('can-edit')).toHaveTextContent('true');
  });

  it('denies cashier writes on the roles contract', async () => {
    wrap(
      <SettingsRemotePage screen="roles" loadRemote={rolesStub()} />,
      '/settings/roles',
      SESSION_FIXTURES.cashier,
    );
    expect(await screen.findByTestId('can-write')).toHaveTextContent('false');
    expect(screen.getByTestId('can-edit')).toHaveTextContent('false');
  });
});
