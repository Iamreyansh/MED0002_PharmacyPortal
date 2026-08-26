---
name: root-config
description: What belongs in src/config vs modules/api. Use when adding shared constants or env readers.
---

# Root config

- Timeouts/paths in `api-client.ts`. Implementation in `modules/api`.
- New shared constant: add to `src/config`, export from `src/config/index.ts` if others need the barrel.
- Never put secrets in config.
