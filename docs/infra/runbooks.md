# Runbooks

## Failed staging smoke

Release stops before production. Fix the host, Core staging origin (`core.api.staging.nammamedmate.com`), or [Core CORS](core-cors.md), then re-run by merging a follow-up or re-running **Release**. Terraform is not auto-reverted.

## Failed production smoke

The production job restores `releases/<previous_sha>/`, invalidates CloudFront, re-smokes, and fails the workflow. Inspect Core at `core.api.nammamedmate.com` and the host artifact. Use **Rollback Portal** if a different SHA is required.

## Terraform apply blocked by plan guard

The plan would destroy or replace a CloudFront distribution, bucket, Route53 record, or ACM certificate. Review the plan. If it is intentional, dispatch Terraform with `allow_destroy=true`.

## Drift

Dispatch Terraform `plan` for the environment. Apply only from a reviewed `workflow_dispatch` apply so the saved plan is the plan that lands.

## MFE version

Portal CI, nightly, and release resolve `MED0003_MFE` `main` at the start of the run and log the SHA. Quality, build, e2e, and deploy jobs in the same run reuse that SHA.

To freeze CI on a known commit, set the repository Actions variable `MFE_REF` to that SHA. Leave it unset to track `main`.
