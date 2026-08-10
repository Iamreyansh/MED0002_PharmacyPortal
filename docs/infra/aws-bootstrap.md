# AWS / Terraform

State and native S3 lockfiles:

| Setting   | Value                          |
| --------- | ------------------------------ |
| Bucket    | `terraform-locks-105927215604` |
| State key | `MED0002/terraform.tfstate`    |
| Locking   | `use_lockfile = true`          |

```bash
pnpm tf:init && pnpm tf:plan
pnpm tf:lock:backup
```
