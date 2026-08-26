---
name: secrets-hygiene
description: VITE_* is public; payment secrets never in the portal. Use when editing env, examples, or CI.
---

# Secrets hygiene

- `VITE_*` is public. Payment secrets never in this portal.
- `.env.example` follows AC-004. Gitignore `.env`. No secrets in skills or docs examples.
