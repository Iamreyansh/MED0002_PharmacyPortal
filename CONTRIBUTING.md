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

## Quick start

```bash
nvm use                 # Node 20 (.nvmrc)
cp .env.example .env
# For local Todo remote:
# VITE_REMOTE_TODO_URL=http://localhost:5101/mf-manifest.json
pnpm install
pnpm dev
```

In a second terminal (MED0003):

```bash
pnpm run dev:with-host
# or: pnpm --filter @medmate/todo dev
```

## Quality commands

| Command                        | Purpose                                     |
| ------------------------------ | ------------------------------------------- |
| `pnpm test`                    | Unit tests (pre-push)                       |
| `pnpm test:coverage`           | Unit tests + **100%** coverage (CI)         |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript                         |
| `pnpm test:e2e`                | Playwright (requires reachable Todo remote) |
| `pnpm quality`                 | Full gate including coverage + build        |

Coverage thresholds stay at **100%** — do not lower them.

## Docs

- [Local development](docs/development/local-development.md)
- [Architecture](docs/architecture/overview.md)
- [Deploy](docs/deploy/deploy.md)
