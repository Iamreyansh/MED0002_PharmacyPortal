import { describe, expect, it, vi } from 'vitest';
import { sanitizeTelemetry, subscribeTelemetry, track } from '@/modules/api';

describe('telemetry', () => {
  it('keeps only the error code for api_error', () => {
    expect(
      sanitizeTelemetry('api_error', {
        code: 'PLAN_FEATURE_LOCKED',
        message: 'no',
        userId: 'u1',
      }),
    ).toEqual({ code: 'PLAN_FEATURE_LOCKED' });
    expect(sanitizeTelemetry('api_error')).toEqual({ code: 'UNKNOWN' });
  });

  it('strips secret keys and token-like values from other events', () => {
    expect(sanitizeTelemetry('mfe_load_error', { remote: 'pos' })).toEqual({
      remote: 'pos',
    });
    expect(sanitizeTelemetry('probe')).toBeUndefined();
    expect(
      sanitizeTelemetry('custom', {
        remote: 'pos',
        refresh_token: 'secret',
        note: 'Bearer abc',
      }),
    ).toEqual({ remote: 'pos' });
  });

  it('notifies subscribers with sanitized properties', () => {
    const sink = vi.fn();
    const stop = subscribeTelemetry(sink);
    track('api_error', { code: 'NETWORK_ERROR', body: { rx: 1 } });
    expect(sink).toHaveBeenCalledWith('api_error', { code: 'NETWORK_ERROR' });
    stop();
    track('api_error', { code: 'NETWORK_ERROR' });
    expect(sink).toHaveBeenCalledTimes(1);
  });
});
