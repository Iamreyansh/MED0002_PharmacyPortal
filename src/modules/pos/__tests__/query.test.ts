import { describe, expect, it } from 'vitest';
import { asCollection, asObject } from '@/modules/pos/lib/query';

describe('pos query helpers', () => {
  it('rejects non-objects', () => {
    expect(asObject('x')).toBeNull();
    expect(asCollection({ other: [1] }, ['items'])).toEqual([]);
  });
});
