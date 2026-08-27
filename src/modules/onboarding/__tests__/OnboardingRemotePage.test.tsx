import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OnboardingFeatureData } from '@medmate/onboarding-contract';
import type { RemoteImporter } from '@medmate/host-kit';
import { OnboardingRemotePage } from '@/modules/onboarding';
import {
  SessionProvider,
  SESSION_FIXTURES,
  resetSessionSnapshot,
} from '@/modules/session';
import { getTokens, resetTokenStore } from '@/modules/api';
import { resetRegisterSubmit } from '@/modules/onboarding/lib/submit-register';
import { resetVerifySubmit } from '@/modules/onboarding/lib/submit-verify';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  resetTokenStore();
  resetSessionSnapshot();
  resetRegisterSubmit();
  resetVerifySubmit();
  sessionStorage.removeItem('medmate.portal.register.email');
});

function wrap(
  ui: ReactElement,
  path: string,
  session = SESSION_FIXTURES.unauthenticated,
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider session={session}>
        <Routes>
          <Route path="/register" element={ui} />
          <Route
            path="/register/verify"
            element={<p data-testid="verify-dest">verify</p>}
          />
          <Route
            path="/onboarding/status"
            element={<p data-testid="status-dest">status</p>}
          />
          <Route path="/" element={<p data-testid="home-dest">home</p>} />
          <Route
            path="/login"
            element={<p data-testid="login-dest">login</p>}
          />
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function registerStub(): RemoteImporter {
  return async () => ({
    default: function RegisterStub(props: Record<string, unknown>) {
      const data = props.data as { feature: OnboardingFeatureData };
      const [error, setError] = useState<string | null>(null);
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void data.feature
              .onSubmit({
                screen: 'register',
                action: 'submit',
                values: {
                  owner_name: 'Priya Sharma',
                  business_name: 'Sri Rama Medicals',
                  phone: '+919876543210',
                  email: 'priya@srirama.in',
                  password: 'Passw0rd!',
                  business_type: 'PHARMACY',
                  address: {
                    flat: '12',
                    area: 'MG Road',
                    city: 'Bengaluru',
                    state: 'Karnataka',
                    pincode: '560001',
                  },
                  gstin: '29AABPP1234F1Z5',
                  drug_licence_number: 'DL-1',
                  pan_number: 'AABPP1234F',
                },
              })
              .then((result) => {
                if (!result.ok) {
                  setError(result.formError ?? null);
                }
              });
          }}
        >
          {error ? <p role="alert">{error}</p> : null}
          <button type="submit">Create Free account</button>
        </form>
      );
    },
  });
}

function verifyStub(): RemoteImporter {
  return async () => ({
    default: function VerifyStub(props: Record<string, unknown>) {
      const data = props.data as { feature: OnboardingFeatureData };
      return (
        <button
          type="button"
          onClick={() => {
            void data.feature.onSubmit({
              screen: 'verify',
              action: 'verifyOtp',
              values: {
                email: data.feature.initialValues?.email ?? 'priya@srirama.in',
                otp: '123456',
              },
            });
          }}
        >
          Verify email
        </button>
      );
    },
  });
}

function statusStub(): RemoteImporter {
  return async () => ({
    default: function StatusStub(props: Record<string, unknown>) {
      const data = props.data as { feature: OnboardingFeatureData };
      return (
        <button
          type="button"
          onClick={() => {
            void data.feature.onSubmit({ screen: 'status', action: 'load' });
          }}
        >
          Load status
        </button>
      );
    },
  });
}

describe('OnboardingRemotePage', () => {
  it('redirects authenticated users away from register', () => {
    wrap(
      <OnboardingRemotePage screen="register" />,
      '/register',
      SESSION_FIXTURES['owner-free'],
    );
    expect(screen.getByTestId('home-dest')).toBeTruthy();
  });

  it('registers and lands on verify', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: { pharmacy_id: 'p1', status: 'PENDING_KYC', plan: 'FREE' },
            }),
            { status: 201 },
          ),
      ),
    );
    wrap(
      <OnboardingRemotePage screen="register" loadRemote={registerStub()} />,
      '/register',
    );
    expect(screen.getByTestId('register-page')).toBeTruthy();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Create Free account' }),
    );
    expect(await screen.findByTestId('verify-dest')).toBeTruthy();
  });

  it('hydrates session after verify', async () => {
    sessionStorage.setItem('medmate.portal.register.email', 'priya@srirama.in');
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('verify-email')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              access_token: 'access',
              refresh_token: 'refresh',
              token_type: 'Bearer',
            },
          }),
          { status: 200 },
        );
      }
      if (url.includes('/auth/me')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              id: 'staff',
              name: 'Priya Sharma',
              role: 'pharmacy_owner',
              permissions: ['*'],
              active_pharmacy: { id: 'p1', name: 'Sri Rama Medicals' },
            },
          }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          data: { status: 'PENDING_KYC', plan: 'FREE' },
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    render(
      <MemoryRouter initialEntries={['/register/verify']}>
        <SessionProvider session={SESSION_FIXTURES.unauthenticated}>
          <Routes>
            <Route
              path="/register/verify"
              element={
                <OnboardingRemotePage
                  screen="verify"
                  loadRemote={verifyStub()}
                />
              }
            />
            <Route
              path="/onboarding/status"
              element={<p data-testid="status-dest">status</p>}
            />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Verify email' }),
    );
    expect(await screen.findByTestId('status-dest')).toBeTruthy();
    expect(getTokens().accessToken).toBe('access');
  });

  it('loads KYC and status screens', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: { status: 'PENDING_KYC', documents: [] },
            }),
            { status: 200 },
          ),
      ),
    );
    render(
      <MemoryRouter initialEntries={['/onboarding/status']}>
        <SessionProvider session={SESSION_FIXTURES['owner-pending-kyc']}>
          <Routes>
            <Route
              path="/onboarding/status"
              element={
                <OnboardingRemotePage
                  screen="status"
                  loadRemote={statusStub()}
                />
              }
            />
            <Route
              path="/onboarding/kyc"
              element={
                <OnboardingRemotePage screen="kyc" loadRemote={statusStub()} />
              }
            />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('onboarding-status-page')).toBeTruthy();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Load status' }),
    );
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
  });

  it('redirects authenticated users away from verify', () => {
    render(
      <MemoryRouter initialEntries={['/register/verify']}>
        <SessionProvider session={SESSION_FIXTURES['owner-pending-kyc']}>
          <Routes>
            <Route
              path="/register/verify"
              element={<OnboardingRemotePage screen="verify" />}
            />
            <Route
              path="/onboarding/status"
              element={<p data-testid="status-dest">status</p>}
            />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('status-dest')).toBeTruthy();
  });

  it('loads the KYC screen for an owner', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              success: true,
              data: { documents: [], ready_to_submit: false },
            }),
            { status: 200 },
          ),
      ),
    );
    function kycStub(): RemoteImporter {
      return async () => ({
        default: function KycStub(props: Record<string, unknown>) {
          const data = props.data as { feature: OnboardingFeatureData };
          return (
            <button
              type="button"
              onClick={() => {
                void data.feature.onSubmit({ screen: 'kyc', action: 'list' });
              }}
            >
              Load documents
            </button>
          );
        },
      });
    }
    render(
      <MemoryRouter initialEntries={['/onboarding/kyc']}>
        <SessionProvider session={SESSION_FIXTURES['owner-pending-kyc']}>
          <Routes>
            <Route
              path="/onboarding/kyc"
              element={
                <OnboardingRemotePage screen="kyc" loadRemote={kycStub()} />
              }
            />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('onboarding-kyc-page')).toBeTruthy();
    expect(screen.getByTestId('onboarding-kyc-page').className).toBe('page');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Load documents' }),
    );
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
  });

  it('uses a configured remote URL when present', async () => {
    vi.stubEnv(
      'VITE_REMOTE_ONBOARDING_URL',
      'https://example.test/mf-manifest.json',
    );
    wrap(<OnboardingRemotePage screen="register" />, '/register');
    expect(await screen.findByTestId('remote-error')).toBeTruthy();
  });

  it('keeps staff write flags off on KYC', async () => {
    function probe(): RemoteImporter {
      return async () => ({
        default: function Probe(props: Record<string, unknown>) {
          const data = props.data as { feature: OnboardingFeatureData };
          return (
            <p data-testid="write-flag">
              {data.feature.canWriteKyc ? 'write' : 'read'}
            </p>
          );
        },
      });
    }
    render(
      <MemoryRouter initialEntries={['/onboarding/kyc']}>
        <SessionProvider session={SESSION_FIXTURES.cashier}>
          <Routes>
            <Route
              path="/onboarding/kyc"
              element={
                <OnboardingRemotePage screen="kyc" loadRemote={probe()} />
              }
            />
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('write-flag')).toHaveTextContent('read');
  });
});
