variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "root_domain" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "api_origin_domain" {
  type        = string
  description = "MED0001 Core hostname (no scheme). Published to SSM and CSP; not a CloudFront origin."
}

variable "mfe_domain_suffix" {
  type = string
}

variable "oac_name" {
  type        = string
  default     = ""
  description = "Keep stable to avoid replacing production OAC."
}

variable "web_acl_id" {
  type    = string
  default = ""
}

variable "response_headers_policy_id" {
  type = string
}

variable "price_class" {
  type    = string
  default = "PriceClass_200"
}

variable "tags" {
  type    = map(string)
  default = {}
}
