# Architecture

Pharmacy Portal is the Module Federation **host**.

```
bootstrap.tsx          # app mount
index.tsx              # host module surface
src/
  app/ pages/ api/ session/ layout/ mfe/ styles/ test/
config/federation.ts   # shared React singleton versions
```

Remotes are loaded by stable manifest URL (`VITE_REMOTE_<NAME>_URL`) via `RemoteLoader`.
All remote props flow through a single `data` envelope mirrored from `@medmate/contracts`.
The host owns the Core fetch client (same-origin `/api/v1` in local Vite, or `VITE_API_BASE_URL` + `/api/v1` in deployed builds); remotes call `data.capabilities.api.request` and never store tokens.

Auth screens (`/login`, `/pos-login`, `/sessions`) currently live in the host until `mfe-auth` exists. Tokens are in `sessionStorage`; `GET /api/v1/auth/me` plus registration-status bootstrap the session. Envelope `pharmacyId` / `userId` come from that session, not demo constants.
