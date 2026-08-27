import {
  applyRuntimeConfig,
  parseRuntimeConfig,
} from '@/config/runtime-config';

export async function loadRuntimeConfig(
  fetcher: typeof fetch = fetch,
): Promise<void> {
  let response: Response;
  try {
    response = await fetcher('/runtime-config.json', { cache: 'no-store' });
  } catch {
    return;
  }

  if (response.status === 404) {
    return;
  }
  if (!response.ok) {
    throw new Error('runtime-config unavailable');
  }

  const body: unknown = await response.json();
  applyRuntimeConfig(parseRuntimeConfig(body));
}
