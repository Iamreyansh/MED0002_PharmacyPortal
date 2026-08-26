# Architecture

Pharmacy Portal (MED0002) is the Module Federation **host**. Host chrome stays in this repo (`modules/shell`). Remotes expose only `./Mfe` and load from `VITE_REMOTE_<NAME>_URL`, or in local dev from the sibling MED0003 `dist` at `/__mfe/<name>/`.

```
src/
  app/                 # composition: bootstrap, App, guards, router
  config/              # shared values: api-client, remotes, env, features, mfe-local-dist
  modules/<name>/      # domain modules; each has index.ts plus owned slots
    index.ts
    config/ api/ store/ ui/ pages/ lib/   # create a slot only when the module owns it
    __tests__/
  shared/              # styles + vitest helpers only
```

## Root config vs module config

- `src/config` — host-wide constants and pure helpers (`REQUEST_TIMEOUT_MS`, remote registry, `VITE_*` readers). No React, no `fetch`. Any module may import `@/config`.
- `src/modules/<name>/config` — domain-only values (nav catalog, form copy). If two modules need the same constant, it belongs in `src/config`.

Cross-module production code imports `@/modules/<name>` barrels. Same-module deep imports are allowed. `api` ↔ `session` may deep-import to avoid circular barrels.

## Local remotes from MED0003 dist

`vite.local-mfe-dist.ts` serves `VITE_MFE_DIST_ROOT` (default `/Volumes/SSD/codebase/medmate/MED0003_MFE/dist`) at `/__mfe/<name>/**` and injects empty `VITE_REMOTE_<NAME>_URL` via Vite `define` from `dist/<name>/mf-manifest.json`. Those URLs are **not** written to `process.env`, so `@module-federation/vite` does not auto-init remotes at bootstrap. `MfeOutlet` registers the remote at load time. Playwright sets `VITE_DISABLE_LOCAL_MFE_DIST=true` so e2e never waits on federation.

## Session and API

The host owns the Core fetch client (same-origin `/api/v1` locally, or `VITE_API_BASE_URL` + `/api/v1` in deployed builds). Remotes call `data.capabilities.api.request` and never store tokens. Tokens live in `sessionStorage` via `modules/api/store/token-store`. Envelope `pharmacyId` / `userId` come from session, not demo constants.

Auth screens (`/login`, `/pos-login`, `/sessions`) stay in the host until `mfe-auth` exists.

## Tests

Unit tests live in that module’s `__tests__/` folder. Coverage gate is 100%. E2E stays `e2e/portal.spec.ts`.
