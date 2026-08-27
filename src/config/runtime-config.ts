export type RuntimeConfig = {
  apiBaseUrl: string;
  mfeDomainSuffix: string;
};

const ALLOWED_KEYS = new Set(['apiBaseUrl', 'mfeDomainSuffix']);
const REJECTED_KEY = /token|secret|password|credential|private/i;
const HTTPS_ORIGIN = /^https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])$/i;
const HOST_SUFFIX = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])$/i;

const EMPTY: RuntimeConfig = {
  apiBaseUrl: '',
  mfeDomainSuffix: '',
};

let current: RuntimeConfig = { ...EMPTY };

export function resetRuntimeConfig(): void {
  current = { ...EMPTY };
}

export function getRuntimeConfig(): RuntimeConfig {
  return current;
}

export function applyRuntimeConfig(config: RuntimeConfig): void {
  current = config;
}

export function parseRuntimeConfig(input: unknown): RuntimeConfig {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('runtime-config must be a JSON object');
  }

  const record = input as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (REJECTED_KEY.test(key) || !ALLOWED_KEYS.has(key)) {
      throw new Error(`runtime-config rejected key: ${key}`);
    }
  }

  return {
    apiBaseUrl: readHttpsOriginOrEmpty(record.apiBaseUrl, 'apiBaseUrl'),
    mfeDomainSuffix: readHostSuffix(record.mfeDomainSuffix, 'mfeDomainSuffix'),
  };
}

function readHttpsOriginOrEmpty(value: unknown, field: string): string {
  if (value === undefined || value === '') {
    return '';
  }
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  const trimmed = value.replace(/\/$/, '');
  if (!HTTPS_ORIGIN.test(trimmed)) {
    throw new Error(`${field} must be an https origin or empty`);
  }
  return trimmed;
}

function readHostSuffix(value: unknown, field: string): string {
  if (value === undefined || value === '') {
    return '';
  }
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  if (!HOST_SUFFIX.test(value)) {
    throw new Error(`${field} must be a hostname suffix`);
  }
  return value;
}
