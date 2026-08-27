output "s3_bucket_name" {
  value = module.site.s3_bucket_name
}

output "cloudfront_distribution_id" {
  value = module.site.cloudfront_distribution_id
}

output "domain_name" {
  value = var.domain_name
}

output "site_url" {
  value = module.site.site_url
}

output "api_origin_domain" {
  value = var.api_origin_domain
}

output "ssm_prefix" {
  value = module.site.ssm_prefix
}

output "github_actions_role_arn" {
  value = module.deploy_role.role_arn
}

output "github_actions_terraform_role_arn" {
  value = module.terraform_apply_role.role_arn
}

output "github_actions_terraform_plan_role_arn" {
  value = module.terraform_plan_role.role_arn
}

output "aws_region" {
  value = var.aws_region
}
