import { TELEMETRY_SECRET_KEY } from '@/config/telemetry';

type TrackFn = (event: string, properties?: Record<string, unknown>) => void;

const sinks = new Set<TrackFn>();

export function sanitizeTelemetry(
  event: string,
  properties?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (event === 'api_error') {
    const code =
      properties && typeof properties.code === 'string'
        ? properties.code
        : 'UNKNOWN';
    return { code };
  }
  if (!properties) {
    return undefined;
  }
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (TELEMETRY_SECRET_KEY.test(key)) {
      continue;
    }
    if (typeof value === 'string' && TELEMETRY_SECRET_KEY.test(value)) {
      continue;
    }
    safe[key] = value;
  }
  return safe;
}

export function subscribeTelemetry(listener: TrackFn): () => void {
  sinks.add(listener);
  return () => {
    sinks.delete(listener);
  };
}

export function track(
  event: string,
  properties?: Record<string, unknown>,
): void {
  const safe = sanitizeTelemetry(event, properties);
  for (const sink of sinks) {
    sink(event, safe);
  }
}

export function resetTelemetry(): void {
  sinks.clear();
}
