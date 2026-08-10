# MED0002 Pharmacy Portal

Module Federation **host** for NammaMedMate pharmacy UX.

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

## Mounting remotes

```tsx
<RemoteLoader
  remote="todo"
  module="./Mfe"
  componentProps={{ data: envelope }}
/>
```

All remote props must be nested under `data`.
