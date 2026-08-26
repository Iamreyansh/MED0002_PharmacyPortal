import type { TokenScope } from '@/session/session';

export const PORTAL_TOKEN_STORAGE_KEY = 'medmate.portal.tokens';

export type TokenSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string;
  tokenScope: TokenScope;
  accessTokenExpiresAt: number | null;
};

export const EMPTY_TOKENS: TokenSnapshot = {
  accessToken: null,
  refreshToken: null,
  tokenType: 'Bearer',
  tokenScope: 'full',
  accessTokenExpiresAt: null,
};

export type TokenStore = {
  get: () => TokenSnapshot;
  set: (tokens: TokenSnapshot) => void;
  clear: () => void;
};

let memory: TokenSnapshot | null = null;
let hydrated = false;

function isTokenScope(value: unknown): value is TokenScope {
  return value === 'full' || value === 'pos';
}

function parseStored(raw: string): TokenSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as Partial<TokenSnapshot>;
    if (!isTokenScope(parsed.tokenScope)) {
      return null;
    }
    if (typeof parsed.tokenType !== 'string') {
      return null;
    }
    const accessToken =
      typeof parsed.accessToken === 'string' ? parsed.accessToken : null;
    const refreshToken =
      typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null;
    const accessTokenExpiresAt =
      typeof parsed.accessTokenExpiresAt === 'number'
        ? parsed.accessTokenExpiresAt
        : null;
    return {
      accessToken,
      refreshToken,
      tokenType: parsed.tokenType,
      tokenScope: parsed.tokenScope,
      accessTokenExpiresAt,
    };
  } catch {
    return null;
  }
}

function readStorage(): TokenSnapshot | null {
  try {
    const raw = sessionStorage.getItem(PORTAL_TOKEN_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return parseStored(raw);
  } catch {
    return null;
  }
}

function writeStorage(tokens: TokenSnapshot | null): void {
  try {
    if (!tokens || (!tokens.accessToken && !tokens.refreshToken)) {
      sessionStorage.removeItem(PORTAL_TOKEN_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(PORTAL_TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Private mode or disabled storage must not break the in-memory session.
  }
}

export function getTokens(): TokenSnapshot {
  if (!hydrated) {
    memory = readStorage();
    hydrated = true;
  }
  return { ...(memory ?? EMPTY_TOKENS) };
}

export function setTokens(tokens: TokenSnapshot): void {
  memory = { ...tokens };
  hydrated = true;
  writeStorage(memory);
}

export function clearTokens(): void {
  memory = { ...EMPTY_TOKENS };
  hydrated = true;
  writeStorage(null);
}

export function hasStoredSession(): boolean {
  const tokens = getTokens();
  return Boolean(tokens.accessToken || tokens.refreshToken);
}

export function applyTokenPair(
  data: Record<string, unknown>,
  now: number = Date.now(),
): boolean {
  if (typeof data.access_token !== 'string' || data.access_token.length === 0) {
    return false;
  }
  const current = getTokens();
  const tokenScope: TokenScope =
    data.token_scope === 'pos'
      ? 'pos'
      : data.token_scope === 'full'
        ? 'full'
        : typeof data.refresh_token === 'string'
          ? 'full'
          : current.tokenScope;
  setTokens({
    accessToken: data.access_token,
    refreshToken:
      typeof data.refresh_token === 'string'
        ? data.refresh_token
        : current.refreshToken,
    tokenType: typeof data.token_type === 'string' ? data.token_type : 'Bearer',
    tokenScope,
    accessTokenExpiresAt:
      typeof data.access_token_expires_in === 'number'
        ? now + data.access_token_expires_in * 1000
        : null,
  });
  return true;
}

export function resetTokenStore(): void {
  memory = null;
  hydrated = false;
  writeStorage(null);
}
