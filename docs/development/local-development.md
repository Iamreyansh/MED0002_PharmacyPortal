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

Set `VITE_API_BASE_URL` to the Core origin (for example `http://localhost:8080`) when calling live `/api/v1` APIs. Leave it unset to use same-origin paths.

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

Default specs assert pharmacy chrome (`portal-home`, `portal-nav`) and that
product navigation has no `/todos` link. They do not require a live Todo MFE.
An expired stored session is routed to the login destination.
