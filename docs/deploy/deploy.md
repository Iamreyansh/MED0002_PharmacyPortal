# Deploy

Every merge to `main`:

1. Deterministic quality and host e2e
2. Apply staging Terraform from a saved plan (creates the stack on first run)
3. Build the host, write `/runtime-config.json`, sync staging, smoke staging
4. Build, sync production, smoke production
5. On production smoke failure, restore the previous known-good `releases/<sha>/` when one exists

Deploy jobs read SSM (`/med0002-pharmacy-portal/<env>/...`) after Terraform publish. Production still falls back to `S3_BUCKET_NAME` / `CLOUDFRONT_DISTRIBUTION_ID` until those parameters exist. PR CI still runs Terraform fmt/validate.

Staging: `https://pharmacy.staging.nammamedmate.com`  
Production: `https://pharmacy.nammamedmate.com`

The SPA calls same-origin `/api/v1`. CloudFront origin for Core is:

- staging → `core.api.staging.nammamedmate.com`
- production → `core.api.nammamedmate.com`

```bash
pnpm smoke:prod
bash scripts/post-deploy-smoke.sh https://pharmacy.staging.nammamedmate.com/
```
