import { describe, expect, it, vi } from 'vitest';
import {
  getRemoteMeta,
  isDemoRemotesEnabled,
  listProductMounts,
  listProductRemoteNames,
} from '@/mfe/registry';
import { PRODUCT_REMOTE_REGISTRY } from '../../config/remotes.registry';

describe('remote registry helpers', () => {
  it('defaults demo remotes to off', () => {
    expect(isDemoRemotesEnabled({})).toBe(false);
    expect(isDemoRemotesEnabled({ VITE_ENABLE_DEMO_REMOTES: 'true' })).toBe(
      true,
    );
    expect(isDemoRemotesEnabled({ VITE_ENABLE_DEMO_REMOTES: 'false' })).toBe(
      false,
    );
  });

  it('looks up product and demo remotes', () => {
    expect(getRemoteMeta('pos')?.route).toBe('/pos');
    expect(getRemoteMeta('todo')?.route).toBe('/todos');
    expect(getRemoteMeta('missing')).toBeUndefined();
  });

  it('lists product remotes without Todo', () => {
    const names = listProductRemoteNames();
    expect(names).not.toContain('todo');
    expect(Object.keys(PRODUCT_REMOTE_REGISTRY)).not.toContain('todo');
    expect(listProductMounts().some((mount) => mount.route === '/todos')).toBe(
      false,
    );
    expect(listProductMounts().some((mount) => mount.route === '/pos')).toBe(
      true,
    );
  });
});

describe('import.meta.env demo flag default', () => {
  it('reads the real env object when no override is passed', () => {
    vi.stubEnv('VITE_ENABLE_DEMO_REMOTES', '');
    expect(isDemoRemotesEnabled()).toBe(false);
    vi.unstubAllEnvs();
  });
});
