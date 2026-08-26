import { describe, expect, it, vi } from 'vitest';
import { defaultReload } from '@/modules/mfe';

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
