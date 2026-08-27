import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig } from '@/app/lib/load-runtime-config';
import { getRuntimeConfig, resetRuntimeConfig } from '@/config/runtime-config';

afterEach(() => {
  resetRuntimeConfig();
});

describe('loadRuntimeConfig', () => {
  it('applies a valid document and ignores a missing file', async () => {
    await loadRuntimeConfig(
      vi.fn(async () => new Response(null, { status: 404 })),
    );
    expect(getRuntimeConfig()).toEqual({
      apiBaseUrl: '',
      mfeDomainSuffix: '',
    });

    await loadRuntimeConfig(
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              apiBaseUrl: '',
              mfeDomainSuffix: 'mfe.nammamedmate.com',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    );
    expect(getRuntimeConfig().mfeDomainSuffix).toBe('mfe.nammamedmate.com');
  });

  it('swallows network errors and fails closed on a bad payload', async () => {
    await loadRuntimeConfig(
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    expect(getRuntimeConfig().mfeDomainSuffix).toBe('');

    await expect(
      loadRuntimeConfig(
        vi.fn(async () => new Response('nope', { status: 500 })),
      ),
    ).rejects.toThrow(/unavailable/);

    await expect(
      loadRuntimeConfig(
        vi.fn(
          async () =>
            new Response(JSON.stringify({ accessToken: 'leak' }), {
              status: 200,
            }),
        ),
      ),
    ).rejects.toThrow(/rejected key/);
  });
});
