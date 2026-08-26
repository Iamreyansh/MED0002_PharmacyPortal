import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { resetApiClientState } from '@/modules/api';
import { resetTelemetry } from '@/modules/api';
import { resetTokenStore } from '@/modules/api';
import { resetSessionSnapshot } from '@/modules/session';

afterEach(() => {
  resetApiClientState();
  resetTokenStore();
  resetSessionSnapshot();
  resetTelemetry();
});
