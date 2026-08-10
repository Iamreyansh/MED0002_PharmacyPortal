# Local development

## Sibling layout

```text
medmate/
  MED0002_PharmacyPortal/   ← this repo
  MED0003_MFE/              ← shared packages + Todo remote
```

`package.json` pulls `@medmate/*` via `file:../MED0003_MFE/packages/...` (and
`@medmate/vite-config` from tooling). There is no `sync:contracts` step.

## Host only (production Todo remote)

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Default `VITE_REMOTE_TODO_URL` points at
`https://todo.mfe.nammamedmate.com/mf-manifest.json`.

## Multi-repo (local Todo remote)

Terminal A — MED0003:

```bash
cd ../MED0003_MFE
pnpm install
pnpm run dev:with-host
# prints: VITE_REMOTE_TODO_URL=http://localhost:5101/mf-manifest.json
```

Terminal B — this repo:

```bash
cp .env.example .env
# set VITE_REMOTE_TODO_URL=http://localhost:5101/mf-manifest.json
pnpm install
pnpm dev
```

## E2E

```bash
# Todo remote must be reachable (local or prod URL in env)
pnpm exec playwright install chromium
pnpm test:e2e
```

Specs require `data-testid="todo-mfe"` and fail on `remote-error` / `remote-missing`.
