# Local development

## Sibling layout

```text
medmate/
  MED0002_PharmacyPortal/   ← this repo
  MED0003_MFE/              ← shared packages + optional demo remotes
```

`package.json` pulls `@medmate/*` via `file:../MED0003_MFE/packages/...` (and
`@medmate/vite-config` from tooling). There is no `sync:contracts` step.

## Host only

```bash
cp .env.example .env
pnpm install
pnpm dev
```

The pharmacy shell does not require a Todo remote. Todo is **demo-only**.

`pnpm dev` proxies `/api` to Core (`VITE_API_PROXY_TARGET`, default `http://localhost:8080`). Leave `VITE_API_BASE_URL` unset locally so the browser stays same-origin and avoids CORS. Deployed environments set `apiBaseUrl` in `/runtime-config.json` to Core (`core.api.staging.nammamedmate.com` / `core.api.nammamedmate.com`) and require [Core CORS](../infra/core-cors.md).

Anonymous visits land on `/login`. Sign in with Core `POST /api/v1/auth/pharmacy/login` (email or +91 mobile + password). POS counters use `/pos-login` with `pharmacy_id`, `staff_id`, and a 4-digit PIN.

## Optional demo Todo remote

Terminal A — MED0003:

```bash
cd ../MED0003_MFE
pnpm install
pnpm run dev:with-host
```

Terminal B — this repo:

```bash
cp .env.example .env
# VITE_ENABLE_DEMO_REMOTES=true
# VITE_REMOTE_TODO_URL=http://localhost:5101/mf-manifest.json
pnpm install
pnpm dev
```

## E2E

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Default specs seed a mocked Core session for chrome, then cover login, me bootstrap, sessions revoke confirm, switch-pharmacy 403, POS PIN, and KYC quotes redirect. They do not require a live Todo MFE.
