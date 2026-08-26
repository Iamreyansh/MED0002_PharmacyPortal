---
name: module-integration
description: Consume modules via barrels and @/config. Use when wiring a new module or fixing import cycles.
---

# Module integration

- Consume another module via `@/modules/<name>`. Consume infra via `@/config`.
- Avoid circular barrels: deep-import the leaf (`session/store/snapshot`) if api↔session cycle appears.
- Tests may deep-import. Production leaf pages must not.
