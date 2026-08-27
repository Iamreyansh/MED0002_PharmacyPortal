terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

locals {
  bucket_name     = var.bucket_name
  site_origin_id  = "s3-site"
  cache_optimized = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  oac_name        = var.oac_name != "" ? var.oac_name : "${var.project_name}-${var.environment}-oac"
}
