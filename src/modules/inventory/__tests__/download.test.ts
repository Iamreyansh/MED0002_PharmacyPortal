import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  downloadBlob,
  downloadDataUrl,
} from '@/modules/inventory/lib/download';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('downloadBlob', () => {
  it('creates a temporary object URL and clicks an anchor', () => {
    const revoke = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:inventory',
      revokeObjectURL: revoke,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    expect(downloadBlob(new Blob(['rows']), 'inventory.xlsx')).toBe(true);
    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith('blob:inventory');
  });

  it('returns false when object URLs are unavailable', () => {
    vi.stubGlobal('URL', {});
    expect(downloadBlob(new Blob(['x']), 'x.xlsx')).toBe(false);
  });
});

describe('downloadDataUrl', () => {
  it('decodes a base64 data URI and downloads the blob', () => {
    const revoke = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:labels',
      revokeObjectURL: revoke,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    expect(
      downloadDataUrl(
        'data:application/pdf;base64,JVBERi0=',
        'rack-labels.pdf',
      ),
    ).toBe(true);
    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith('blob:labels');
  });

  it('decodes a percent-encoded data URI', () => {
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:plain',
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    expect(downloadDataUrl('data:text/plain,hello%20world', 'note.txt')).toBe(
      true,
    );
  });

  it('returns false for a non-data URI', () => {
    expect(downloadDataUrl('https://example.test/labels.pdf', 'x.pdf')).toBe(
      false,
    );
  });

  it('returns false when object URLs are unavailable', () => {
    vi.stubGlobal('URL', {});
    expect(downloadDataUrl('data:,hi', 'note.txt')).toBe(false);
  });

  it('treats an empty payload as an empty blob', () => {
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:empty',
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    expect(downloadDataUrl('data:,', 'empty.bin')).toBe(true);
  });
});
