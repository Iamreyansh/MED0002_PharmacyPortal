---
name: vercel-composition-patterns
description: Vercel composition patterns adapted to this Vite host. Use when composing routes or splitting modules.
---

# Composition

- `src/app` composes. Modules own screens. Remotes own domain MFEs.
- Do not fetch in layout chrome. Session bootstrap is `HostApiLifecycle`.
- Share constants via `@/config`, not prop drilling of URLs.
