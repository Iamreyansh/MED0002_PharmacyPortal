import type { PageMeta } from '@medmate/procurement-contract';

export function withQuery(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') {
      continue;
    }
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export function asCollection<T>(data: unknown, keys: readonly string[]): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }
  return [];
}

export function asObject<T>(data: unknown): T | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }
  return data as T;
}

export function asMeta(meta: unknown): PageMeta {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return {};
  }
  return meta as PageMeta;
}

export function asNested<T>(data: unknown, key: string): T | null {
  const row = asObject<Record<string, unknown>>(data);
  if (!row) {
    return null;
  }
  const nested = row[key];
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
    return null;
  }
  return nested as T;
}
