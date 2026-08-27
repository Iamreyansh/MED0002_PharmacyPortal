# Architecture

Pharmacy Portal (MED0002) is the Module Federation **host**. Host chrome stays in this repo (`modules/shell`). Remotes expose only `./Mfe` and load from `https://<name>.<mfeDomainSuffix>/mf-manifest.json` (runtime `/runtime-config.json`), an explicit `VITE_REMOTE_<NAME>_URL`, or in local dev from the sibling MED0003 `dist` at `/__mfe/<name>/`.

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

`vite.local-mfe-dist.ts` serves `VITE_MFE_DIST_ROOT` (default `/Volumes/SSD/codebase/medmate/MED0003_MFE/dist`) at `/__mfe/<name>/**` and, when a remote URL is unset, injects `/__mfe/<name>/mf-manifest.json` into `import.meta.env.VITE_REMOTE_*_URL` via Vite `define`. Those keys are **not** written to `process.env`, so `@module-federation/vite` does not auto-init remotes at bootstrap. `MfeOutlet` registers the remote at load time. Default Playwright (`e2e/portal.spec.ts`) sets `VITE_DISABLE_LOCAL_MFE_DIST=true`; federation contract tests leave local dist enabled.

## Session and API

The host owns the Core fetch client. Locally the browser stays same-origin (`/api/v1` via the Vite proxy). Deployed environments call Core directly (`https://core.api.staging.nammamedmate.com` or `https://core.api.nammamedmate.com`) using `/runtime-config.json` `apiBaseUrl`. Remotes call `data.capabilities.api.request` and never store tokens. Tokens live in `sessionStorage` via `modules/api/store/token-store`. Envelope `pharmacyId` / `userId` come from session, not demo constants.

Deployed builds do not bake environment URLs. `public/runtime-config.json` is overwritten per environment with `apiBaseUrl` and the public MFE suffix.

Auth screens (`/login`, `/pos-login`, `/sessions`) load the `auth` remote. Onboarding screens (`/register`, `/register/verify`, `/onboarding/status`, `/onboarding/kyc`) load the `onboarding` remote. Environment runtime config sets `mfeDomainSuffix` so every remote resolves without a per-MFE URL. Host adapters (`AuthRemotePage` / `OnboardingRemotePage`) own `onSubmit`, tokens, hydrate, and navigation. Remotes never receive `access_token` / `refresh_token` / MFA challenge tokens. Default Playwright (`e2e/portal.spec.ts`) keeps remotes off; `e2e/auth-federation.spec.ts` and `e2e/onboarding-federation.spec.ts` are the federation contracts (require `MED0003_MFE/dist/auth` and `dist/onboarding`).

## Tests

Unit tests live in that module’s `__tests__/` folder. Coverage gate is 100%. E2E stays `e2e/portal.spec.ts` (remotes off) plus federation specs when `dist/auth` or `dist/onboarding` is present.
