---
name: threat-model-host
description: STRIDE one-pager for the host. Use when changing remotes, login return URLs, or POS scope.
---

# Threat model (host)

- Spoofed remote → allowlist + `/__mfe` + contract version.
- Token theft via XSS → no HTML injection, sessionStorage, no tokens on envelope.
- Open redirect after login → `isSafeReturnPath`.
- Privilege via hidden nav → Core 403.
- POS breakout → `PosScopeGuard`.
