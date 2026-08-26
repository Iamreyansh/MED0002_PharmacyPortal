---
name: secure-auth-session
description: Token lifecycle for this host. Use when changing login, logout, refresh, or POS scope.
---

# Secure auth session

- Tokens: `token-store.ts` + `sessionStorage` only. Never duplicate storage.
- POS-scoped token cannot navigate to the full portal.
- Logout always clears local tokens even if the network fails.
- Refresh is single-flight. POS tokens skip `/auth/me`.
