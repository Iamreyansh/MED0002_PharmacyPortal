# Agents

Pharmacy Portal host. Read `.cursor/rules/` and the matching `.cursor/skills/` before coding.

## Tree

- `src/config` — shared values (api-client, remotes, env, features). Import `@/config`.
- `src/modules/<name>/index.ts` — public API. Production cross-module code uses the barrel.
- `src/app` — composition only (router, guards, bootstrap).
- Tests: `src/**/__tests__/`. Coverage 100%.

## Local MFEs

Serve sibling `MED0003_MFE/dist` at `/__mfe/<name>`. Do not create `apps/shell` in MED0003. Host owns chrome (`modules/shell`).

## Must-read security skills

| Work                     | Skills                                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| Auth / session / API     | `secure-auth-session`, `secrets-hygiene`, `secure-logging`               |
| MFE / envelope / remotes | `secure-mfe-federation`, `pharmacy-data-protection`, `threat-model-host` |
| UI / layout              | design skills, `ponytail`, `security-xss`                                |
| Env / CI / e2e           | `secrets-hygiene`, `secure-playwright`, `supply-chain-integrity`         |

Do not put secrets in `VITE_*`, skills, or docs examples. Tokens stay in `sessionStorage` via `modules/api/store/token-store` only.
