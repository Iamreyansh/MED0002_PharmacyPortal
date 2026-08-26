---
name: owasp-spa
description: Maps OWASP Top 10 (2021) to this host. Use when reviewing security of SPA changes.
---

# OWASP SPA

- A01 broken access: guards + Core 403, not hidden nav.
- A02 crypto: no tokens in logs.
- A03 injection: no HTML injection.
- A04 insecure design: envelope without tokens.
- A05 misconfig: no secrets in `VITE_*`.
- A06 vulns: pin deps, React 18.3.1 singleton.
- A07 auth: token-store + logout/refresh.
- A08 integrity: allowlisted remoteEntry.
- A09 logging: deny-list.
- A10 SSRF analogue: remote URL injection — registry + env only.
