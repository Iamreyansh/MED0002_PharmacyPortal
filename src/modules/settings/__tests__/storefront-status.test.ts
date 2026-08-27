import { afterEach, describe, expect, it } from 'vitest';
import { STOREFRONT_EVENT } from '@medmate/settings-contract';
import {
  applyStorefrontStatus,
  getStorefrontStatus,
  resetStorefrontStatus,
  subscribeStorefrontStatus,
} from '@/modules/settings/store/storefront-status';
import {
  emitHostEvent,
  onHostEvent,
  resetHostEvents,
} from '@/modules/mfe/lib/host-events';

afterEach(() => {
  resetStorefrontStatus();
  resetHostEvents();
});

describe('storefront status store', () => {
  it('ignores non-objects and applies boolean fields', () => {
    applyStorefrontStatus(null);
    expect(getStorefrontStatus().isOnline).toBeNull();
    applyStorefrontStatus({ is_online: true, admin_forced_offline: true });
    expect(getStorefrontStatus()).toEqual({
      isOnline: true,
      adminForcedOffline: true,
    });
    applyStorefrontStatus({ other: 1 });
    expect(getStorefrontStatus().isOnline).toBe(true);
    let calls = 0;
    const stop = subscribeStorefrontStatus(() => {
      calls += 1;
    });
    applyStorefrontStatus({ is_online: false });
    expect(calls).toBe(1);
    stop();
    applyStorefrontStatus({ is_online: true });
    expect(calls).toBe(1);
  });
});

describe('host events', () => {
  it('emits to subscribers and cleans up empty topics', () => {
    const seen: unknown[] = [];
    const stop = onHostEvent(STOREFRONT_EVENT, (payload) => {
      seen.push(payload);
    });
    emitHostEvent('missing');
    emitHostEvent(STOREFRONT_EVENT, { is_online: true });
    expect(seen).toEqual([{ is_online: true }]);
    stop();
    emitHostEvent(STOREFRONT_EVENT, { is_online: false });
    expect(seen).toHaveLength(1);
  });
});
