# Architecture

Pharmacy Portal is the Module Federation **host**.

```
bootstrap.tsx          # app mount
index.tsx              # host module surface
src/
  app/ pages/ mfe/ styles/ test/
config/federation.ts   # shared React singleton versions
```

Remotes are loaded by stable manifest URL (`VITE_REMOTE_<NAME>_URL`) via `RemoteLoader`.
All remote props flow through a single `data` envelope mirrored from `@medmate/contracts`.
