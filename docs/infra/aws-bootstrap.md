# AWS / Terraform

State lives in `s3://terraform-locks-105927215604`:

| Environment | Key                                 |
| ----------- | ----------------------------------- |
| Production  | `MED0002/terraform.tfstate`         |
| Staging     | `MED0002/staging/terraform.tfstate` |

Locking uses native S3 lockfiles (`use_lockfile = true`). Provider locks are committed at `infra/environments/<env>/.terraform.lock.hcl`.

## One-time account bootstrap

Already done for this account: GitHub OIDC provider and the state bucket. GitHub environments that must exist: `staging`, `production`, `terraform`, `terraform-staging`. Optional for plan jobs: `terraform-plan-staging`, `terraform-plan-production`.

Release on `main` applies staging Terraform (GitHub environment `terraform` + `AWS_TF_ROLE_ARN`), then deploys and smokes staging, then deploys production. The first staging apply attaches a temporary `staging-bootstrap` inline policy to the existing terraform role so it can create the new bucket, WAF, and SSM parameters. The staging deploy job assumes the role Terraform just created; do not point `staging` at the production `AWS_ROLE_ARN`.

1. Keep `AWS_TF_ROLE_ARN` (existing production terraform role) available to environment `terraform`.
2. After the first successful staging apply, copy `github_actions_role_arn` into GitHub environment `staging` as `AWS_ROLE_ARN` (needed for **Rollback Portal**). Copy `github_actions_terraform_role_arn` into `terraform-staging` as `AWS_TF_APPLY_ROLE_ARN` when you switch staging apply off the production terraform role.
3. Dispatch **Terraform** `production` / `apply` after the production SPA with `apiBaseUrl` is live, to drop leftover `/api/*`, publish SSM, and update CSP. Re-run if the first apply updates IAM and a later resource is still denied in the same session.

## Local commands

```bash
pnpm tf:fmt
pnpm tf:validate:staging
pnpm tf:validate:production
pnpm tf:plan:staging
pnpm tf:plan:production
```

Apply only the saved `tfplan` from the matching environment directory. `scripts/tf-plan-guard.sh` refuses unexpected destroy/replace unless `TF_ALLOW_DESTROY=true`.
