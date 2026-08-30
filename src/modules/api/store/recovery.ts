import { useSyncExternalStore } from 'react';

export type RecoveryKind = 'unavailable' | 'rate_limited';

export type RecoveryState = {
  kind: RecoveryKind;
  retryAfterSeconds: number;
};

let current: RecoveryState | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getRecovery(): RecoveryState | null {
  return current;
}

export function setRecovery(next: RecoveryState): void {
  current = next;
  emit();
}

export function clearRecovery(): void {
  if (current === null) {
    return;
  }
  current = null;
  emit();
}

export function resetRecovery(): void {
  current = null;
  emit();
}

export function subscribeRecovery(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRecovery(): RecoveryState | null {
  return useSyncExternalStore(subscribeRecovery, getRecovery, getRecovery);
}
