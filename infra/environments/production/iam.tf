locals {
  github_subjects = {
    deploy = [
      "repo:${local.repo_node}:environment:production",
      "repo:${local.repo_slug}:environment:production",
    ]
    terraform_apply = [
      "repo:${local.repo_node}:environment:terraform-production",
      "repo:${local.repo_slug}:environment:terraform-production",
      "repo:${local.repo_node}:environment:terraform",
      "repo:${local.repo_slug}:environment:terraform",
    ]
    terraform_plan = [
      "repo:${local.repo_node}:environment:terraform-plan-production",
      "repo:${local.repo_slug}:environment:terraform-plan-production",
    ]
  }

  deploy_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ListBucket"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = [module.site.s3_bucket_arn]
      },
      {
        Sid    = "ObjectAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
        ]
        Resource = ["${module.site.s3_bucket_arn}/*"]
      },
      {
        Sid    = "InvalidateDistribution"
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation",
        ]
        Resource = [module.site.cloudfront_distribution_arn]
      },
      {
        Sid    = "ReleasePointer"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:PutParameter",
        ]
        Resource = ["arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${module.site.ssm_prefix}/*"]
      }
    ]
  })

  terraform_state = [
    {
      Effect = "Allow"
      Action = [
        "s3:ListBucket",
        "s3:GetBucketVersioning",
        "s3:GetBucketLocation",
      ]
      Resource = ["arn:aws:s3:::${var.tf_state_bucket}"]
      Condition = {
        StringLike = {
          "s3:prefix" = [
            "MED0002/terraform.tfstate*",
            "MED0002/staging/*",
          ]
        }
      }
    },
    {
      Effect = "Allow"
      Action = ["s3:GetObject"]
      Resource = [
        "arn:aws:s3:::${var.tf_state_bucket}/MED0002/terraform.tfstate*",
        "arn:aws:s3:::${var.tf_state_bucket}/MED0002/staging/*",
      ]
    },
  ]

  terraform_read = [
    {
      Effect = "Allow"
      Action = [
        "s3:Get*",
        "s3:List*",
        "s3:Describe*",
      ]
      Resource = [
        module.site.s3_bucket_arn,
        "${module.site.s3_bucket_arn}/*",
      ]
    },
    {
      Effect = "Allow"
      Action = [
        "cloudfront:Get*",
        "cloudfront:List*",
        "cloudfront:Describe*",
      ]
      Resource = ["*"]
    },
    {
      Effect = "Allow"
      Action = [
        "acm:Describe*",
        "acm:List*",
        "acm:Get*",
      ]
      Resource = ["*"]
    },
    {
      Effect = "Allow"
      Action = [
        "route53:Get*",
        "route53:List*",
      ]
      Resource = ["*"]
    },
    {
      Effect = "Allow"
      Action = [
        "iam:GetRole",
        "iam:GetRolePolicy",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies",
        "iam:GetOpenIDConnectProvider",
        "iam:ListOpenIDConnectProviders",
      ]
      Resource = ["*"]
    },
    {
      Effect = "Allow"
      Action = [
        "wafv2:Get*",
        "wafv2:List*",
        "wafv2:Describe*",
      ]
      Resource = ["*"]
    },
    {
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:DescribeParameters",
      ]
      Resource = ["arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${module.site.ssm_prefix}/*"]
    },
    {
      Effect = "Allow"
      Action = [
        "cloudwatch:DescribeAlarms",
        "cloudwatch:ListTagsForResource",
        "cloudwatch:GetDashboard",
      ]
      Resource = ["*"]
    },
  ]
}

module "deploy_role" {
  source = "../../modules/github-oidc-role"

  name              = "${var.project_name}-github-actions"
  description       = "Production application deploy"
  oidc_provider_arn = data.aws_iam_openid_connect_provider.github.arn
  subjects          = local.github_subjects.deploy
  policy_json       = local.deploy_policy
  tags              = merge(local.tags, { Purpose = "deploy" })
}

module "terraform_plan_role" {
  source = "../../modules/github-oidc-role"

  name              = "${var.project_name}-github-terraform-plan"
  description       = "Production terraform plan (read-only)"
  oidc_provider_arn = data.aws_iam_openid_connect_provider.github.arn
  subjects          = local.github_subjects.terraform_plan
  policy_json = jsonencode({
    Version   = "2012-10-17"
    Statement = concat(local.terraform_state, local.terraform_read)
  })
  tags = merge(local.tags, { Purpose = "terraform-plan" })
}

module "terraform_apply_role" {
  source = "../../modules/github-oidc-role"

  name              = "${var.project_name}-github-terraform"
  description       = "Production terraform apply"
  oidc_provider_arn = data.aws_iam_openid_connect_provider.github.arn
  subjects          = local.github_subjects.terraform_apply
  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      local.terraform_state,
      [
        {
          Effect = "Allow"
          Action = ["s3:PutObject", "s3:DeleteObject"]
          Resource = [
            "arn:aws:s3:::${var.tf_state_bucket}/MED0002/terraform.tfstate*",
            "arn:aws:s3:::${var.tf_state_bucket}/MED0002/staging/*",
          ]
        },
        {
          Sid      = "SiteBucketAdmin"
          Effect   = "Allow"
          Action   = ["s3:*"]
          Resource = [module.site.s3_bucket_arn, "${module.site.s3_bucket_arn}/*"]
        },
        {
          Sid    = "StagingSiteBucketBootstrap"
          Effect = "Allow"
          Action = ["s3:*"]
          Resource = [
            "arn:aws:s3:::${var.project_name}-staging-${data.aws_caller_identity.current.account_id}",
            "arn:aws:s3:::${var.project_name}-staging-${data.aws_caller_identity.current.account_id}/*",
          ]
        },
        {
          Effect   = "Allow"
          Action   = ["cloudfront:*"]
          Resource = ["arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:*"]
        },
        {
          Effect   = "Allow"
          Action   = ["acm:*"]
          Resource = ["arn:aws:acm:*:${data.aws_caller_identity.current.account_id}:*"]
        },
        {
          Effect = "Allow"
          Action = [
            "route53:ChangeResourceRecordSets",
            "route53:GetHostedZone",
            "route53:ListResourceRecordSets",
            "route53:ListTagsForResource",
            "route53:ListHostedZones",
            "route53:ListHostedZonesByName",
            "route53:GetChange",
          ]
          Resource = ["*"]
        },
        {
          Effect = "Allow"
          Action = [
            "wafv2:*",
            "ssm:*",
            "cloudwatch:*",
          ]
          Resource = ["*"]
        },
        {
          Effect = "Allow"
          Action = [
            "iam:CreateRole",
            "iam:DeleteRole",
            "iam:GetRole",
            "iam:UpdateRole",
            "iam:UpdateAssumeRolePolicy",
            "iam:TagRole",
            "iam:UntagRole",
            "iam:PassRole",
            "iam:PutRolePolicy",
            "iam:GetRolePolicy",
            "iam:DeleteRolePolicy",
            "iam:ListRolePolicies",
            "iam:ListAttachedRolePolicies",
            "iam:GetOpenIDConnectProvider",
            "iam:ListOpenIDConnectProviders",
          ]
          Resource = ["*"]
        },
      ],
      local.terraform_read,
    )
  })
  tags = merge(local.tags, { Purpose = "terraform-apply" })
}
