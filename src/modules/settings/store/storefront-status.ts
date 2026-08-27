import { STOREFRONT_EVENT } from '@medmate/settings-contract';
import { useSyncExternalStore } from 'react';

export type StorefrontStatus = {
  isOnline: boolean | null;
  adminForcedOffline: boolean;
};

const EMPTY: StorefrontStatus = {
  isOnline: null,
  adminForcedOffline: false,
};

let current: StorefrontStatus = { ...EMPTY };
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getStorefrontStatus(): StorefrontStatus {
  return current;
}

export function applyStorefrontStatus(payload: unknown): void {
  if (!payload || typeof payload !== 'object') {
    return;
  }
  const row = payload as Record<string, unknown>;
  const next: StorefrontStatus = { ...current };
  if (typeof row.is_online === 'boolean') {
    next.isOnline = row.is_online;
  }
  if (typeof row.admin_forced_offline === 'boolean') {
    next.adminForcedOffline = row.admin_forced_offline;
  }
  current = next;
  emit();
}

export function resetStorefrontStatus(): void {
  current = { ...EMPTY };
  emit();
}

export function subscribeStorefrontStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStorefrontStatus(): StorefrontStatus {
  return useSyncExternalStore(
    subscribeStorefrontStatus,
    getStorefrontStatus,
    getStorefrontStatus,
  );
}

export { STOREFRONT_EVENT };
