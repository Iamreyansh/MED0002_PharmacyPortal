# Deploy

Every merge to `main`:

1. Deterministic quality and host e2e
2. Build the host, write `/runtime-config.json`, sync production, wait for CloudFront, smoke production
3. On production smoke failure, restore the previous known-good `releases/<sha>/` when one exists

Terraform apply is a separate **Terraform** `workflow_dispatch` until the staging stack and per-environment OIDC roles exist. After that, deploy jobs prefer SSM stack outputs over `S3_BUCKET_NAME` / `CLOUDFRONT_DISTRIBUTION_ID`. PR CI still runs Terraform fmt/validate.

Staging: `https://pharmacy.staging.nammamedmate.com`  
Production: `https://pharmacy.nammamedmate.com`

The SPA calls same-origin `/api/v1`. CloudFront origin for Core is:

- staging → `core.api.staging.nammamedmate.com`
- production → `core.api.nammamedmate.com`

```bash
pnpm smoke:prod
bash scripts/post-deploy-smoke.sh https://pharmacy.staging.nammamedmate.com/
```
