---
name: host-folder-structure
description: When to add a module vs extend src/config. Use when creating files under src/.
---

# Host folder structure

- Shared constant → `src/config`. Domain code → `src/modules/<name>` with `index.ts`.
- Add `config/` `api/` `store/` `ui/` only when that module owns the concern.
- App composition stays in `src/app`. No new `src/pages` or `src/layout`.
