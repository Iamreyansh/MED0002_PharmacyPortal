provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

locals {
  environment = "staging"
  bucket_name = "${var.project_name}-staging-${data.aws_caller_identity.current.account_id}"
  repo_slug   = "${var.github_org}/${var.github_repo}"
  repo_node   = "${var.github_org}@${var.github_org_id}/${var.github_repo}@${var.github_repo_id}"
  tags = {
    Project     = var.project_name
    Environment = local.environment
  }
}

module "edge" {
  source = "../../modules/edge-security"

  providers = {
    aws.us_east_1 = aws.us_east_1
  }

  name              = "${var.project_name}-${local.environment}"
  mfe_domain_suffix = var.mfe_domain_suffix
  api_origin_domain = var.api_origin_domain
  enable_waf        = true
  rate_limit        = var.waf_rate_limit
  csp_report_only   = true
  tags              = local.tags
}

module "site" {
  source = "../../modules/static-site"

  providers = {
    aws.us_east_1 = aws.us_east_1
  }

  project_name               = var.project_name
  environment                = local.environment
  domain_name                = var.domain_name
  root_domain                = var.root_domain
  bucket_name                = local.bucket_name
  api_origin_domain          = var.api_origin_domain
  mfe_domain_suffix          = var.mfe_domain_suffix
  web_acl_id                 = module.edge.web_acl_id
  response_headers_policy_id = module.edge.response_headers_policy_id
  tags                       = local.tags
}
