output "web_acl_id" {
  value = var.enable_waf ? aws_wafv2_web_acl.this[0].arn : ""
}

output "response_headers_policy_id" {
  value = aws_cloudfront_response_headers_policy.this.id
}
