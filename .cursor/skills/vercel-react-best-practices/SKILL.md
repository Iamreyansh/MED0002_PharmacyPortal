---
name: vercel-react-best-practices
description: React 18 best practices for this host. Use when writing components, effects, or memoization.
---

# React best practices

- Effects for sync only (viewport, bootstrap, subscriptions).
- `flushSync` only when logout/login must commit before navigate.
- Do not put tokens in context value objects remotes receive.
