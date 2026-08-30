import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob } from '@/modules/billing/lib/download';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('downloadBlob', () => {
  it('creates a temporary object URL and clicks an anchor', () => {
    const revoke = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:invoices',
      revokeObjectURL: revoke,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    expect(downloadBlob(new Blob(['rows']), 'invoices.xlsx')).toBe(true);
    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith('blob:invoices');
  });

  it('returns false when object URLs are unavailable', () => {
    vi.stubGlobal('URL', {});
    expect(downloadBlob(new Blob(['x']), 'x.xlsx')).toBe(false);
  });
});
