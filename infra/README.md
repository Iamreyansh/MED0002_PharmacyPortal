# Pharmacy Portal infrastructure

Host-only AWS stack. MED0001 Core and MED0003 remotes stay in their own repos.

## Environments

| Stack      | Hostname                            | Core origin (`/api/*`)              | MFE suffix                     | State key                           |
| ---------- | ----------------------------------- | ----------------------------------- | ------------------------------ | ----------------------------------- |
| Staging    | `pharmacy.staging.nammamedmate.com` | `core.api.staging.nammamedmate.com` | `staging.mfe.nammamedmate.com` | `MED0002/staging/terraform.tfstate` |
| Production | `pharmacy.nammamedmate.com`         | `core.api.nammamedmate.com`         | `mfe.nammamedmate.com`         | `MED0002/terraform.tfstate`         |

The browser always calls same-origin `/api/v1`. CloudFront forwards `/api/*` to Core over HTTPS with caching disabled. Public runtime config (`/runtime-config.json`) carries only the MFE domain suffix.

## Layout

- `modules/static-site` — private S3, CloudFront, ACM, Route53, SSM, alarms
- `modules/edge-security` — WAF + security headers
- `modules/github-oidc-role` — environment-scoped GitHub OIDC roles
- `environments/staging` and `environments/production`

Production keeps the existing state key and uses `moved` blocks so the current bucket/distribution are adopted, not replaced.

## Apply contract

Never apply without a saved plan from the same job:

1. `terraform fmt -check`
2. `terraform init -lockfile=readonly`
3. `terraform validate`
4. `terraform plan -out=tfplan`
5. `scripts/tf-plan-guard.sh` (blocks unexpected destroy/replace)
6. `terraform apply tfplan`

GitHub Actions does this in `.github/workflows/terraform.yml`. Release applies staging, deploys and smokes staging, then applies and promotes production.

## GitHub environments

Create (unprotected unless noted): `staging`, `production`, `terraform`, `terraform-staging`, `terraform-plan-staging`, `terraform-plan-production`.

Required reviewers belong on `production` and `terraform` only if you want a human gate. Plan environments must stay unprotected so PRs do not wait.

After the first apply, copy these outputs into environment variables/secrets:

- `github_actions_role_arn` → `AWS_ROLE_ARN` (deploy)
- `github_actions_terraform_role_arn` → `AWS_TF_APPLY_ROLE_ARN` / existing `AWS_TF_ROLE_ARN`
- `github_actions_terraform_plan_role_arn` → `AWS_TF_PLAN_ROLE_ARN`

Bucket and CloudFront IDs are published to SSM (`/med0002-pharmacy-portal/<env>/...`). Deploy jobs read SSM; they should not store those IDs as secrets.
