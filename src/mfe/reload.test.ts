import { describe, expect, it, vi } from 'vitest';
import { defaultReload } from '@/mfe/reload';

describe('defaultReload', () => {
  it('calls location.reload', () => {
    const reload = vi.fn();
    const location = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...location, reload },
    });
    defaultReload();
    expect(reload).toHaveBeenCalled();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: location,
    });
  });
});
