# Runbooks

## Failed staging smoke

Release stops before production. Fix the host or Core staging origin, then re-run by merging a follow-up or re-running **Release**. Terraform is not auto-reverted.

## Failed production smoke

The production job restores `releases/<previous_sha>/`, invalidates CloudFront, re-smokes, and fails the workflow. Inspect Core at `core.api.nammamedmate.com` and the host artifact. Use **Rollback Portal** if a different SHA is required.

## Terraform apply blocked by plan guard

The plan would destroy or replace a CloudFront distribution, bucket, Route53 record, or ACM certificate. Review the plan. If it is intentional, dispatch Terraform with `allow_destroy=true`.

## Drift

Dispatch Terraform `plan` for the environment. Apply only from **Release** or a reviewed `workflow_dispatch` apply so the saved plan is the plan that lands.

## MFE version

Portal CI/release check out the SHA in `.github/mfe-ref`. Bumping federation is a portal PR that changes that file.
