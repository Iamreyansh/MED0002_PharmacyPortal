moved {
  from = aws_s3_bucket.site
  to   = module.site.aws_s3_bucket.site
}

moved {
  from = aws_s3_bucket_public_access_block.site
  to   = module.site.aws_s3_bucket_public_access_block.site
}

moved {
  from = aws_s3_bucket_ownership_controls.site
  to   = module.site.aws_s3_bucket_ownership_controls.site
}

moved {
  from = aws_s3_bucket_server_side_encryption_configuration.site
  to   = module.site.aws_s3_bucket_server_side_encryption_configuration.site
}

moved {
  from = aws_s3_bucket_versioning.site
  to   = module.site.aws_s3_bucket_versioning.site
}

moved {
  from = aws_acm_certificate.site
  to   = module.site.aws_acm_certificate.site
}

moved {
  from = aws_route53_record.acm_validation
  to   = module.site.aws_route53_record.acm_validation
}

moved {
  from = aws_acm_certificate_validation.site
  to   = module.site.aws_acm_certificate_validation.site
}

moved {
  from = aws_cloudfront_origin_access_control.site
  to   = module.site.aws_cloudfront_origin_access_control.site
}

moved {
  from = aws_cloudfront_distribution.site
  to   = module.site.aws_cloudfront_distribution.site
}

moved {
  from = aws_s3_bucket_policy.site
  to   = module.site.aws_s3_bucket_policy.site
}

moved {
  from = aws_route53_record.ipv4
  to   = module.site.aws_route53_record.ipv4
}

moved {
  from = aws_route53_record.ipv6
  to   = module.site.aws_route53_record.ipv6
}

moved {
  from = aws_iam_role.github_actions
  to   = module.deploy_role.aws_iam_role.this
}

moved {
  from = aws_iam_role_policy.github_deploy
  to   = module.deploy_role.aws_iam_role_policy.this
}

moved {
  from = aws_iam_role.github_actions_terraform
  to   = module.terraform_apply_role.aws_iam_role.this
}

moved {
  from = aws_iam_role_policy.github_terraform
  to   = module.terraform_apply_role.aws_iam_role_policy.this
}
