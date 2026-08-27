# AWS / Terraform

State lives in `s3://terraform-locks-105927215604`:

| Environment | Key                                 |
| ----------- | ----------------------------------- |
| Production  | `MED0002/terraform.tfstate`         |
| Staging     | `MED0002/staging/terraform.tfstate` |

Locking uses native S3 lockfiles (`use_lockfile = true`). Provider locks are committed at `infra/environments/<env>/.terraform.lock.hcl`.

## One-time account bootstrap

Already done for this account: GitHub OIDC provider and the state bucket. After that, developers only merge PRs.

Release on `main` deploys the production host with the existing deploy role (`AWS_ROLE_ARN`) and bucket/distribution secrets until Terraform has published SSM parameters. It does **not** apply Terraform on every push: the existing terraform role trusts GitHub environment `terraform`, and the staging apply role does not exist until the staging stack is created.

1. Create GitHub environments listed in `infra/README.md`.
2. Set `AWS_TF_ROLE_ARN` (existing production terraform role) on `terraform`.
3. Dispatch **Terraform** `production` / `apply` so `moved` blocks adopt current resources. Re-run if the first apply updates IAM and a later resource (WAF/SSM) is still denied in the same session.
4. Dispatch **Terraform** `staging` / `apply` to create the staging stack. That job also uses environment `terraform` until the dedicated staging role exists.
5. Copy new role ARNs into `staging` / `production` / `terraform-staging` environments. After that, deploy jobs read SSM (`/med0002-pharmacy-portal/<env>/...`) instead of bucket ID secrets.

## Local commands

```bash
pnpm tf:fmt
pnpm tf:validate:staging
pnpm tf:validate:production
pnpm tf:plan:staging
pnpm tf:plan:production
```

Apply only the saved `tfplan` from the matching environment directory. `scripts/tf-plan-guard.sh` refuses unexpected destroy/replace unless `TF_ALLOW_DESTROY=true`.
