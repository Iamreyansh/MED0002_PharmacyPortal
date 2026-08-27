# Deploy

Every merge to `main`:

1. Deterministic quality and host e2e
2. Build the host, write `/runtime-config.json` (`apiBaseUrl` + MFE suffix), sync staging, smoke staging against Core
3. Apply staging Terraform from a saved plan (drops leftover CloudFront `/api/*`, publishes SSM, updates CSP)
4. Re-smoke staging
5. Build, sync production, smoke production
6. On production smoke failure, restore the previous known-good `releases/<sha>/` when one exists
7. After production smoke is green, dispatch Terraform `production` / `apply` to drop production `/api/*` and update CSP. Do not apply that origin-removal before the SPA with `apiBaseUrl` is live.

Deploy jobs read SSM (`/med0002-pharmacy-portal/<env>/...`) after Terraform publish. Staging deploy uses GitHub environment `staging` `AWS_ROLE_ARN` (same pattern as production). Production still falls back to `S3_BUCKET_NAME` / `CLOUDFRONT_DISTRIBUTION_ID` until those parameters exist. PR CI still runs Terraform fmt/validate.

Staging: `https://pharmacy.staging.nammamedmate.com`  
Production: `https://pharmacy.nammamedmate.com`

The SPA calls Core directly:

- staging → `https://core.api.staging.nammamedmate.com/api/v1`
- production → `https://core.api.nammamedmate.com/api/v1`

CloudFront serves the SPA only. That requires MED0001 CORS first. See [Core CORS](../infra/core-cors.md).

```bash
pnpm smoke:prod
bash scripts/post-deploy-smoke.sh https://pharmacy.staging.nammamedmate.com/
```
