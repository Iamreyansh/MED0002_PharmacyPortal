# Deploy

Every merge to `main`:

1. Deterministic quality, host e2e, and Terraform fmt/validate
2. Apply staging Terraform from a saved plan
3. Build the host, write `/runtime-config.json`, sync staging, wait for CloudFront, smoke staging
4. Apply production Terraform from a saved plan
5. Promote the same git SHA to production and smoke it
6. On production smoke failure, restore the previous known-good `releases/<sha>/`

Staging: `https://pharmacy.staging.nammamedmate.com`  
Production: `https://pharmacy.nammamedmate.com`

The SPA calls same-origin `/api/v1`. CloudFront origin for Core is:

- staging → `core.api.staging.nammamedmate.com`
- production → `core.api.nammamedmate.com`

```bash
pnpm smoke:prod
bash scripts/post-deploy-smoke.sh https://pharmacy.staging.nammamedmate.com/
```
