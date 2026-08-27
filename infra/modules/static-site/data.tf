terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

locals {
  bucket_name            = var.bucket_name
  api_origin_id          = "core-api"
  site_origin_id         = "s3-site"
  cache_optimized        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  cache_disabled         = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
  all_viewer_except_host = "33f36d7e-f396-46d9-90e0-52428a34d9dc"
  oac_name               = var.oac_name != "" ? var.oac_name : "${var.project_name}-${var.environment}-oac"
}
