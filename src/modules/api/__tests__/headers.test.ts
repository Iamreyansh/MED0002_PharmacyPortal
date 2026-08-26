import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRequestHeaders } from '@/modules/api';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildRequestHeaders', () => {
  it('omits Authorization when there is no access token', () => {
    const headers = buildRequestHeaders({
      accessToken: null,
      jsonBody: false,
    });
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('Authorization')).toBeNull();
  });

  it('attaches Bearer and Idempotency-Key', () => {
    const headers = buildRequestHeaders({
      accessToken: 'access-secret',
      idempotencyKey: 'intent-1',
      jsonBody: true,
    });
    expect(headers.get('Authorization')).toBe('Bearer access-secret');
    expect(headers.get('Idempotency-Key')).toBe('intent-1');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('strips caller Authorization and never logs tokens', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const debug = vi
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);

    const headers = buildRequestHeaders({
      accessToken: 'host-token',
      extra: {
        Authorization: 'Bearer remote-token',
        Cookie: 'session=1',
        'Idempotency-Key': 'ignored',
        'X-Request-Id': 'req-1',
      },
      jsonBody: false,
    });

    expect(headers.get('Authorization')).toBe('Bearer host-token');
    expect(headers.get('Cookie')).toBeNull();
    expect(headers.get('Idempotency-Key')).toBeNull();
    expect(headers.get('X-Request-Id')).toBe('req-1');

    const combined = [
      ...log.mock.calls,
      ...warn.mock.calls,
      ...error.mock.calls,
      ...debug.mock.calls,
    ]
      .flat()
      .map(String)
      .join(' ');
    expect(combined).not.toContain('host-token');
    expect(combined).not.toContain('remote-token');
    expect(combined).not.toContain('Bearer');
  });

  it('keeps caller Accept and Content-Type and skips auth when asked', () => {
    const headers = buildRequestHeaders({
      accessToken: 'token',
      extra: {
        Accept: 'application/pdf',
        'Content-Type': 'text/plain',
      },
      jsonBody: true,
      skipAuth: true,
    });
    expect(headers.get('Accept')).toBe('application/pdf');
    expect(headers.get('Content-Type')).toBe('text/plain');
    expect(headers.get('Authorization')).toBeNull();
  });
});
