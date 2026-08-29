# Contributing to MED0002 Pharmacy Portal

## Sibling layout

Clone Portal and MFE as siblings under the same parent directory:

```text
medmate/
  MED0002_PharmacyPortal/   ← this repo
  MED0003_MFE/
```

Shared packages resolve via `file:` dependencies in `package.json`:

- `@medmate/contracts`
- `@medmate/federation-config`
- `@medmate/host-kit`
- `@medmate/vite-config`

There is no `sync:contracts` script — edit contracts in MED0003 and reinstall / let `file:` resolve.

CI and release check out the latest `MED0003_MFE` `main` automatically. You do not bump a pin file for contract or remote changes. To freeze a run, set the repository Actions variable `MFE_REF`.

## Quick start

```bash
nvm use                 # Node 20 (.nvmrc)
cp .env.example .env
pnpm install
pnpm dev
```

If the shell stays blank, a configured `VITE_REMOTE_*_URL` is likely unreachable.
Federation auto-init runs before React; unset those vars or start the remotes.

```bash
# Optional local Todo smoke remote (demo only):
# VITE_ENABLE_DEMO_REMOTES=true
# VITE_REMOTE_TODO_URL=http://localhost:5101/mf-manifest.json
```

In a second terminal (MED0003), only if exercising the demo remote:

```bash
pnpm run dev:with-host
# or: pnpm --filter @medmate/todo dev
```

## Quality commands

| Command                        | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| `pnpm test`                    | Unit tests (pre-push)                      |
| `pnpm test:coverage`           | Unit tests + **100%** coverage (CI)        |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript                        |
| `pnpm test:e2e`                | Playwright (host chrome; no Todo required) |
| `pnpm quality`                 | Full gate including coverage + build       |

Coverage thresholds stay at **100%** — do not lower them.

## Docs

- [Local development](docs/development/local-development.md)
- [Architecture](docs/architecture/overview.md)
- [Deploy](docs/deploy/deploy.md)
