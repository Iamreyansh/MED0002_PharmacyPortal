output "s3_bucket_name" {
  value = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "domain_name" {
  value = var.domain_name
}

output "site_url" {
  value = "https://${var.domain_name}"
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}

output "github_actions_terraform_role_arn" {
  value = aws_iam_role.github_actions_terraform.arn
}

output "aws_region" {
  value = var.aws_region
}
