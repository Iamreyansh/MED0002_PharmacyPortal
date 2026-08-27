variable "name" {
  type = string
}

variable "mfe_domain_suffix" {
  type = string
}

variable "api_origin_domain" {
  type        = string
  description = "MED0001 Core hostname (no scheme). Used in CSP connect-src."
}

variable "enable_waf" {
  type    = bool
  default = true
}

variable "rate_limit" {
  type    = number
  default = 2000
}

variable "csp_report_only" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
