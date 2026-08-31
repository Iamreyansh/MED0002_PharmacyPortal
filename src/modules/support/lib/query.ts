import type {
  HelpArticle,
  HelpArticleSummary,
  SupportTicket,
} from '@medmate/support-contract';
import { articleIdOf, ticketIdOf } from '@medmate/support-contract';

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

export function asMeta(meta: unknown): {
  page?: number;
  limit?: number;
  total?: number;
  has_next?: boolean;
} {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    return {};
  }
  return meta as {
    page?: number;
    limit?: number;
    total?: number;
    has_next?: boolean;
  };
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

export function ticketFrom(data: unknown): SupportTicket | null {
  return asObject<SupportTicket>(data);
}

export function ticketIdFrom(data: unknown): string | null {
  const ticket = ticketFrom(data);
  const id = ticketIdOf(ticket);
  return id || null;
}

export function articlesFrom(data: unknown): HelpArticleSummary[] {
  return asCollection<HelpArticleSummary>(data, ['articles', 'items']);
}

export function articleFrom(data: unknown): HelpArticle | null {
  return asObject<HelpArticle>(data);
}

export function articleIdFrom(data: unknown): string {
  return articleIdOf(articleFrom(data));
}
