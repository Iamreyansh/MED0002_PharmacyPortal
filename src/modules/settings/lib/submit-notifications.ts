import type {
  NotificationPreferencesPayload,
  NotificationPreferencesSavePayload,
  PreferenceToggle,
  SettingsCommand,
  SettingsSubmitResult,
} from '@medmate/settings-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/settings/lib/errors';

const PREFERENCES_PATH = '/api/v1/pharmacy/notification-preferences';

export async function submitNotifications(
  command: SettingsCommand,
): Promise<SettingsSubmitResult> {
  if (command.screen !== 'notifications') {
    return {
      ok: false,
      formError: 'This screen cannot update notification preferences.',
    };
  }
  if (command.action === 'load') {
    const result = await hostApi.request<unknown>({
      path: PREFERENCES_PATH,
      method: 'GET',
    });
    if (!result.ok) {
      return failureResult(result.code, result.message, result.details);
    }
    return { ok: true, preferences: asPreferences(result.data) };
  }
  if (command.action !== 'save') {
    return {
      ok: false,
      formError: 'This screen cannot update notification preferences.',
    };
  }
  const result = await hostApi.request<NotificationPreferencesSavePayload>({
    path: PREFERENCES_PATH,
    method: 'PATCH',
    body: {
      channels: command.values.channels,
      categories: command.values.categories,
    },
    idempotencyKey: createIdempotencyKey(),
  });
  if (!result.ok) {
    return failureResult(result.code, result.message, result.details);
  }
  return {
    ok: true,
    savedPreferences: result.data ?? { updated: true },
  };
}

function asPreferences(data: unknown): NotificationPreferencesPayload {
  if (!data || typeof data !== 'object') {
    return { channels: {}, categories: {} };
  }
  const raw = data as Record<string, unknown>;
  return {
    pharmacy_id:
      typeof raw.pharmacy_id === 'string' ? raw.pharmacy_id : undefined,
    channels: asToggleMap(raw.channels),
    categories: asToggleMap(raw.categories),
    updated_at: typeof raw.updated_at === 'string' ? raw.updated_at : undefined,
  };
}

function asToggleMap(value: unknown): Record<string, PreferenceToggle> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, PreferenceToggle> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      continue;
    }
    const toggle = raw as Record<string, unknown>;
    if (typeof toggle.enabled !== 'boolean') {
      continue;
    }
    out[key] = {
      enabled: toggle.enabled,
      can_disable: toggle.can_disable === true,
      status: typeof toggle.status === 'string' ? toggle.status : undefined,
    };
  }
  return out;
}
