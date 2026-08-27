resource "aws_cloudfront_monitoring_subscription" "site" {
  distribution_id = aws_cloudfront_distribution.site.id

  monitoring_subscription {
    realtime_metrics_subscription_config {
      realtime_metrics_subscription_status = "Enabled"
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "origin_5xx" {
  alarm_name          = "${var.project_name}-${var.environment}-origin-5xx"
  alarm_description   = "CloudFront origin 5xx rate is elevated"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Origin5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.site.id
    Region         = "Global"
  }

  tags = var.tags
}

resource "aws_ssm_parameter" "s3_bucket_name" {
  name  = "/${var.project_name}/${var.environment}/s3_bucket_name"
  type  = "String"
  value = aws_s3_bucket.site.bucket
  tags  = var.tags
}

resource "aws_ssm_parameter" "cloudfront_distribution_id" {
  name  = "/${var.project_name}/${var.environment}/cloudfront_distribution_id"
  type  = "String"
  value = aws_cloudfront_distribution.site.id
  tags  = var.tags
}

resource "aws_ssm_parameter" "site_url" {
  name  = "/${var.project_name}/${var.environment}/site_url"
  type  = "String"
  value = "https://${var.domain_name}"
  tags  = var.tags
}

resource "aws_ssm_parameter" "mfe_domain_suffix" {
  name  = "/${var.project_name}/${var.environment}/mfe_domain_suffix"
  type  = "String"
  value = var.mfe_domain_suffix
  tags  = var.tags
}

resource "aws_ssm_parameter" "current_release_sha" {
  name  = "/${var.project_name}/${var.environment}/current_release_sha"
  type  = "String"
  value = "unset"
  tags  = var.tags

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "previous_release_sha" {
  name  = "/${var.project_name}/${var.environment}/previous_release_sha"
  type  = "String"
  value = "unset"
  tags  = var.tags

  lifecycle {
    ignore_changes = [value]
  }
}
