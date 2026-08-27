# Deploy

Every merge to `main`:

1. Deterministic quality and host e2e
2. Apply staging Terraform from a saved plan (creates the stack on first run)
3. Build the host, write `/runtime-config.json` (`apiBaseUrl` + MFE suffix), sync staging, smoke staging against Core
4. Build, sync production, smoke production
5. On production smoke failure, restore the previous known-good `releases/<sha>/` when one exists

Staging deploy assumes the deploy role Terraform just created. Do not use the production `AWS_ROLE_ARN` from GitHub environment `staging`. After the first apply, copy that role ARN into `staging` as `AWS_ROLE_ARN` for **Rollback Portal**. Production still falls back to `S3_BUCKET_NAME` / `CLOUDFRONT_DISTRIBUTION_ID` until SSM parameters exist.

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
