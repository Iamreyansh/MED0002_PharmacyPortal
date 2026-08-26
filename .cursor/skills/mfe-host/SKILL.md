---
name: mfe-host
description: Host federation runtime: envelope 1.0.0, MfeOutlet, local dist. Use when changing remotes or MfeOutlet.
---

# MFE host

- Envelope contract 1.0.0 via `useMfeEnvelope`. Registry from `@/config/remotes`.
- Local dist from `@/config/mfe-local-dist` served at `/__mfe/<name>`.
- `MfeOutlet` timeout + degraded UI. No tokens on `data`.
