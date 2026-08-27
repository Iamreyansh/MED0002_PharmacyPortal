variable "name" {
  type = string
}

variable "mfe_domain_suffix" {
  type = string
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
