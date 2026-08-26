import { flushSync } from 'react-dom';
import type {
  AuthCommand,
  AuthSessionRow,
  AuthSubmitResult,
} from '@medmate/auth-contract';
import { hostApi } from '@/modules/api';
import { formatIst, performLogout } from '@/modules/session';

export type SessionsSubmitDeps = {
  navigate: (path: string, options?: { replace?: boolean }) => void;
  clearSession: () => void;
};

type SessionRow = {
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  city?: string;
  country?: string;
  last_active_at?: string;
  is_current?: boolean;
  device?: { platform?: string; device_id?: string; app_version?: string };
};

export function asSessionRows(value: unknown): SessionRow[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((row): row is SessionRow =>
    Boolean(
      row &&
      typeof row === 'object' &&
      typeof (row as SessionRow).session_id === 'string',
    ),
  );
}

export function toAuthSessionRow(row: SessionRow): AuthSessionRow {
  const location = [row.city, row.country].filter(Boolean).join(', ');
  return {
    sessionId: row.session_id,
    device: row.device?.platform ?? row.user_agent,
    ipAddress: row.ip_address,
    location: location || undefined,
    lastActiveAt: formatIst(row.last_active_at) ?? undefined,
    isCurrent: row.is_current,
  };
}

export async function submitSessions(
  command: AuthCommand,
  deps: SessionsSubmitDeps,
  currentRows: SessionRow[] = [],
): Promise<AuthSubmitResult & { mappedRows?: SessionRow[] }> {
  if (command.portalType !== 'sessions') {
    return {
      ok: false,
      formError: 'This portal does not support that sign-in method.',
    };
  }

  if (command.action === 'list') {
    const page = command.values?.page ?? 1;
    const result = await hostApi.request<SessionRow[]>({
      path: `/api/v1/auth/sessions?page=${page}&limit=20`,
      method: 'GET',
    });
    if (!result.ok) {
      if (result.status === 401) {
        deps.navigate('/login', { replace: true });
      }
      return {
        ok: false,
        code: result.code,
        formError: result.code ?? 'UNKNOWN',
      };
    }
    const mappedRows = asSessionRows(result.data);
    const meta = result.details as
      { has_next?: unknown; page?: unknown } | undefined;
    return {
      ok: true,
      sessions: mappedRows.map(toAuthSessionRow),
      page: typeof meta?.page === 'number' ? meta.page : page,
      hasNext: meta?.has_next === true,
      mappedRows,
    };
  }

  const sessionId = command.values.sessionId;
  const result = await hostApi.request({
    path: `/api/v1/auth/sessions/${sessionId}`,
    method: 'DELETE',
  });
  if (!result.ok) {
    return {
      ok: false,
      code: result.code,
      formError: result.code ?? 'UNKNOWN',
    };
  }
  const row = currentRows.find((item) => item.session_id === sessionId);
  if (row?.is_current) {
    const dest = await performLogout();
    flushSync(() => {
      deps.clearSession();
    });
    deps.navigate(dest, { replace: true });
  }
  return { ok: true, nextStep: 'done' };
}
