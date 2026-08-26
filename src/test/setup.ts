import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { resetApiClientState } from '@/api/client';
import { resetTelemetry } from '@/api/telemetry';
import { resetTokenStore } from '@/api/token-store';
import { resetSessionSnapshot } from '@/session/snapshot';

afterEach(() => {
  resetApiClientState();
  resetTokenStore();
  resetSessionSnapshot();
  resetTelemetry();
});
