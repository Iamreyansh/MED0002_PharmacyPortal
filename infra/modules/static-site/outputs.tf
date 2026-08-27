output "s3_bucket_name" {
  value = aws_s3_bucket.site.bucket
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.site.arn
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "cloudfront_distribution_arn" {
  value = aws_cloudfront_distribution.site.arn
}

output "domain_name" {
  value = var.domain_name
}

output "site_url" {
  value = "https://${var.domain_name}"
}

output "ssm_prefix" {
  value = "/${var.project_name}/${var.environment}"
}
