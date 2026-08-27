#!/usr/bin/env bash
# Grant the existing production terraform OIDC role enough IAM to create the
# staging stack. The live role can PutRolePolicy on itself but cannot create a
# new bucket / WAF / SSM until this extra policy exists.
set -euo pipefail

ROLE_NAME="${TF_BOOTSTRAP_ROLE_NAME:-med0002-pharmacy-portal-github-terraform}"
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
BUCKET="med0002-pharmacy-portal-staging-${ACCOUNT}"
STATE_BUCKET="${TF_STATE_BUCKET:-terraform-locks-${ACCOUNT}}"

POLICY="$(python3 - "${BUCKET}" "${STATE_BUCKET}" <<'PY'
import json, sys
bucket, state = sys.argv[1], sys.argv[2]
print(json.dumps({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "StagingState",
            "Effect": "Allow",
            "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            "Resource": [f"arn:aws:s3:::{state}/MED0002/staging/*"],
        },
        {
            "Sid": "StagingStateList",
            "Effect": "Allow",
            "Action": ["s3:ListBucket", "s3:GetBucketVersioning", "s3:GetBucketLocation"],
            "Resource": [f"arn:aws:s3:::{state}"],
            "Condition": {"StringLike": {"s3:prefix": ["MED0002/staging/*"]}},
        },
        {
            "Sid": "StagingSiteBucket",
            "Effect": "Allow",
            "Action": ["s3:*"],
            "Resource": [f"arn:aws:s3:::{bucket}", f"arn:aws:s3:::{bucket}/*"],
        },
        {
            "Sid": "EdgeAndConfig",
            "Effect": "Allow",
            "Action": ["wafv2:*", "ssm:*", "cloudwatch:*"],
            "Resource": ["*"],
        },
    ],
}, separators=(",", ":")))
PY
)"

aws iam put-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-name staging-bootstrap \
  --policy-document "${POLICY}"
echo "Attached staging-bootstrap to ${ROLE_NAME} (bucket ${BUCKET})"
# IAM is eventually consistent; give the next terraform plan a chance to see it.
sleep 15
