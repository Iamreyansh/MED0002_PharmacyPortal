---
name: secure-mfe-federation
description: Allowlisted remotes and envelope integrity. Use when changing MFE loading or remote URLs.
---

# Secure MFE federation

- Allowlisted origins / same-origin `/__mfe` in local. No query-param remote URLs.
- Contract version check. Degraded UI without leaking fetch errors that include tokens.
- `publicPath: auto` on built remotes; do not rewrite to a third-party origin.
