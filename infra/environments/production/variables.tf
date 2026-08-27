variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "root_domain" {
  type    = string
  default = "nammamedmate.com"
}

variable "domain_name" {
  type    = string
  default = "pharmacy.nammamedmate.com"
}

variable "api_origin_domain" {
  type        = string
  description = "MED0001 Core hostname (no scheme). Browser calls this origin; CloudFront is SPA only."
}

variable "mfe_domain_suffix" {
  type = string
}

variable "github_org" {
  type = string
}

variable "github_org_id" {
  type = string
}

variable "github_repo" {
  type = string
}

variable "github_repo_id" {
  type = string
}

variable "project_name" {
  type    = string
  default = "med0002-pharmacy-portal"
}

variable "tf_state_bucket" {
  type    = string
  default = "terraform-locks-105927215604"
}

variable "waf_rate_limit" {
  type    = number
  default = 2000
}
