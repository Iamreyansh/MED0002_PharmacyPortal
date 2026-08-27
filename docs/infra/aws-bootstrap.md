# AWS / Terraform

State lives in `s3://terraform-locks-105927215604`:

| Environment | Key                                 |
| ----------- | ----------------------------------- |
| Production  | `MED0002/terraform.tfstate`         |
| Staging     | `MED0002/staging/terraform.tfstate` |

Locking uses native S3 lockfiles (`use_lockfile = true`). Provider locks are committed at `infra/environments/<env>/.terraform.lock.hcl`.

## One-time account bootstrap

Already done for this account: GitHub OIDC provider and the state bucket. After that, developers only merge PRs.

1. Create GitHub environments listed in `infra/README.md`.
2. Set `AWS_TF_ROLE_ARN` (existing production terraform role) on `terraform`.
3. Merge this repo change, then run **Terraform** `workflow_dispatch` `production` / `apply` so `moved` blocks adopt current resources.
4. Run `staging` / `apply` to create the staging stack.
5. Copy new role ARNs into `staging` / `production` / `terraform-staging` environments.

## Local commands

```bash
pnpm tf:fmt
pnpm tf:validate:staging
pnpm tf:validate:production
pnpm tf:plan:staging
pnpm tf:plan:production
```

Apply only the saved `tfplan` from the matching environment directory. `scripts/tf-plan-guard.sh` refuses unexpected destroy/replace unless `TF_ALLOW_DESTROY=true`.
