---
name: modern-frontend-design
description: Modern React host patterns for this repo. Use when adding pages, hooks, or client state.
---

# Modern frontend

- React 18.3.1 singleton. Functional components only.
- Session via `useSession` / `useSessionStore`. Do not invent a second store.
- Route screens in module `pages/`. Composition in `src/app`.
