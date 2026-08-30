import { describe, expect, it } from 'vitest';
import {
  clearRecovery,
  getRecovery,
  resetRecovery,
  setRecovery,
  subscribeRecovery,
} from '@/modules/api';

describe('recovery store', () => {
  it('publishes, clears, and resets listeners', () => {
    const seen: Array<string | null> = [];
    const stop = subscribeRecovery(() => {
      seen.push(getRecovery()?.kind ?? null);
    });
    setRecovery({ kind: 'unavailable', retryAfterSeconds: 0 });
    expect(getRecovery()).toEqual({
      kind: 'unavailable',
      retryAfterSeconds: 0,
    });
    clearRecovery();
    expect(getRecovery()).toBeNull();
    clearRecovery();
    setRecovery({ kind: 'rate_limited', retryAfterSeconds: 4 });
    resetRecovery();
    expect(getRecovery()).toBeNull();
    stop();
    setRecovery({ kind: 'unavailable', retryAfterSeconds: 1 });
    expect(seen).toEqual(['unavailable', null, 'rate_limited', null]);
  });
});
