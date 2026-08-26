import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { resetApiClientState } from '@/modules/api';
import { resetTelemetry } from '@/modules/api';
import { resetTokenStore } from '@/modules/api';
import { resetSessionSnapshot } from '@/modules/session';

vi.mock('@medmate/host-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    defaultRemoteImporter: async () => {
      throw new Error('unit-test remote disabled');
    },
  };
});

afterEach(() => {
  resetApiClientState();
  resetTokenStore();
  resetSessionSnapshot();
  resetTelemetry();
});
