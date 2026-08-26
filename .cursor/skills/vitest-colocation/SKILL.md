---
name: vitest-colocation
description: Per-module __tests__/ and coverage excludes. Use when adding or moving unit tests.
---

# Vitest colocation

- Tests in `src/<area>/__tests__/`. Render helper: `src/shared/test/render.tsx`.
- Coverage excludes: `src/**/index.ts`, bootstrap, `src/shared/test`, `__tests__`.
- Reset token and session snapshot stores in `afterEach`.
