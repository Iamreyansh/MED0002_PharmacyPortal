import { describe, expect, it } from 'vitest';
import { parseCoreEnvelope } from '@/api/core-envelope';
import { PORTAL_ERROR } from '@/api/codes';

describe('parseCoreEnvelope', () => {
  it('maps a success envelope to ok data', () => {
    const result = parseCoreEnvelope<{ x: number }>(
      JSON.stringify({ success: true, data: { x: 1 } }),
      200,
    );
    expect(result.ok).toBe(true);
    expect(result.data.x).toBe(1);
  });

  it('maps PLAN_FEATURE_LOCKED without rewriting the code', () => {
    const result = parseCoreEnvelope(
      JSON.stringify({
        success: false,
        error: { code: 'PLAN_FEATURE_LOCKED', message: 'locked' },
      }),
      403,
    );
    expect(result.ok).toBe(false);
    expect(result.code).toBe('PLAN_FEATURE_LOCKED');
    expect(result.message).toBe('locked');
  });

  it('reads retry_after_seconds and details', () => {
    const result = parseCoreEnvelope(
      JSON.stringify({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          retry_after_seconds: 2,
          details: { field: 'x' },
        },
      }),
      429,
    );
    expect(result.retryAfterSeconds).toBe(2);
    expect(result.details).toEqual({ field: 'x' });
  });

  it('uses UNKNOWN when the error object is missing a code', () => {
    const result = parseCoreEnvelope(
      JSON.stringify({ success: false, error: {} }),
      500,
    );
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toBeUndefined();
  });

  it('treats a missing error object as UNKNOWN', () => {
    const result = parseCoreEnvelope(JSON.stringify({ success: false }), 500);
    expect(result.code).toBe('UNKNOWN');
  });

  it('returns UPSTREAM_INVALID_JSON for non-JSON', () => {
    const result = parseCoreEnvelope('<html>', 500);
    expect(result.ok).toBe(false);
    expect(result.code).toBe(PORTAL_ERROR.UPSTREAM_INVALID_JSON);
    expect(result.status).toBe(500);
  });

  it('returns UPSTREAM_INVALID_JSON when success is absent', () => {
    const result = parseCoreEnvelope(JSON.stringify({ data: {} }), 200);
    expect(result.code).toBe(PORTAL_ERROR.UPSTREAM_INVALID_JSON);
  });

  it('returns UPSTREAM_INVALID_JSON when success is not boolean', () => {
    const result = parseCoreEnvelope(
      JSON.stringify({ success: 'yes', data: {} }),
      200,
    );
    expect(result.code).toBe(PORTAL_ERROR.UPSTREAM_INVALID_JSON);
  });

  it('returns UPSTREAM_INVALID_JSON for null JSON', () => {
    expect(parseCoreEnvelope('null', 200).code).toBe(
      PORTAL_ERROR.UPSTREAM_INVALID_JSON,
    );
  });
});
