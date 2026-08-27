type Handler = (payload?: unknown) => void;

const listeners = new Map<string, Set<Handler>>();

export function emitHostEvent(event: string, payload?: unknown): void {
  const handlers = listeners.get(event);
  if (!handlers) {
    return;
  }
  for (const handler of handlers) {
    handler(payload);
  }
}

export function onHostEvent(event: string, handler: Handler): () => void {
  const existing = listeners.get(event) ?? new Set<Handler>();
  existing.add(handler);
  listeners.set(event, existing);
  return () => {
    existing.delete(handler);
    if (existing.size === 0) {
      listeners.delete(event);
    }
  };
}

export function resetHostEvents(): void {
  listeners.clear();
}
