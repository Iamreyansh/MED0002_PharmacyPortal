# MED0002 Pharmacy Portal

Module Federation **host** for NammaMedMate pharmacy UX.

## Layout

```
bootstrap.tsx
index.tsx
config/federation.ts
src/{app,pages,host,styles,test}
docs/{architecture,development,deploy,infra}
```

## Sibling packages

This host depends on MED0003 shared packages via `file:` paths (no publish / no
`sync:contracts`):

```json
"@medmate/contracts": "file:../MED0003_MFE/packages/shared/contracts",
"@medmate/federation-config": "file:../MED0003_MFE/packages/shared/federation-config",
"@medmate/host-kit": "file:../MED0003_MFE/packages/shared/host-kit",
"@medmate/vite-config": "file:../MED0003_MFE/packages/tooling/vite-config"
```

Clone both repos as siblings:

```text
medmate/
  MED0002_PharmacyPortal/
  MED0003_MFE/
```

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Set `VITE_REMOTE_TODO_URL` to the Todo manifest:

- Local: `http://localhost:5101/mf-manifest.json`
- Prod: `https://todo.mfe.nammamedmate.com/mf-manifest.json`

## Production domain

`https://pharmacy.nammamedmate.com`

## Docs

- [Architecture](docs/architecture/overview.md)
- [Local development](docs/development/local-development.md)
- [Deploy](docs/deploy/deploy.md)
- [AWS bootstrap](docs/infra/aws-bootstrap.md)
