import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { resetRuntimeConfig } from '@/config/runtime-config';
import { resetApiClientState } from '@/modules/api';
import { resetTelemetry } from '@/modules/api';
import { resetTokenStore } from '@/modules/api';
import { resetSessionSnapshot } from '@/modules/session';
import { resetHostEvents } from '@/modules/mfe/lib/host-events';
import { resetStorefrontStatus } from '@/modules/settings/store/storefront-status';

vi.mock('@medmate/host-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    defaultRemoteImporter: async () => {
      throw new Error('unit-test remote disabled');
    },
  };
});

// CI bakes VITE_MFE_DOMAIN_SUFFIX for production builds. Keep unit tests on
// explicit VITE_REMOTE_*_URL / missing-remote unless a spec stubs the suffix.
vi.stubEnv('VITE_MFE_DOMAIN_SUFFIX', '');

afterEach(() => {
  resetApiClientState();
  resetTokenStore();
  resetSessionSnapshot();
  resetStorefrontStatus();
  resetHostEvents();
  resetTelemetry();
  resetRuntimeConfig();
  vi.stubEnv('VITE_MFE_DOMAIN_SUFFIX', '');
});
