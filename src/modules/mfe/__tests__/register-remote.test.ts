import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ensureRemoteRegistered,
  resetRegisteredRemotes,
  resolveRemoteEntry,
} from '@/modules/mfe/lib/register-remote';

afterEach(() => {
  resetRegisteredRemotes();
});

describe('resolveRemoteEntry', () => {
  it('resolves a relative manifest against the page origin', () => {
    expect(
      resolveRemoteEntry(
        '/__mfe/todo/mf-manifest.json',
        'http://localhost:5174',
      ),
    ).toBe('http://localhost:5174/__mfe/todo/mf-manifest.json');
  });

  it('keeps an absolute manifest URL', () => {
    expect(
      resolveRemoteEntry(
        'https://todo.example/mf-manifest.json',
        'http://localhost:5174',
      ),
    ).toBe('https://todo.example/mf-manifest.json');
  });
});

describe('ensureRemoteRegistered', () => {
  it('no-ops without an entry or a host', () => {
    expect(ensureRemoteRegistered('todo', '/__mfe/todo/mf-manifest.json')).toBe(
      false,
    );
    expect(
      ensureRemoteRegistered('todo', '', {
        registerRemotes: vi.fn(),
      }),
    ).toBe(false);
  });

  it('registers a remote once', () => {
    const registerRemotes = vi.fn();
    expect(
      ensureRemoteRegistered('todo', '/__mfe/todo/mf-manifest.json', {
        registerRemotes,
      }),
    ).toBe(true);
    expect(
      ensureRemoteRegistered('todo', '/__mfe/todo/mf-manifest.json', {
        registerRemotes,
      }),
    ).toBe(true);
    expect(registerRemotes).toHaveBeenCalledTimes(1);
    expect(registerRemotes).toHaveBeenCalledWith([
      {
        name: 'todo',
        alias: 'todo',
        entry: `${window.location.origin}/__mfe/todo/mf-manifest.json`,
        type: 'module',
      },
    ]);
  });
});
