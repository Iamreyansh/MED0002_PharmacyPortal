variable "name" {
  type = string
}

variable "description" {
  type    = string
  default = ""
}

variable "oidc_provider_arn" {
  type = string
}

variable "subjects" {
  type        = list(string)
  description = "token.actions.githubusercontent.com:sub values allowed to assume the role."
}

variable "policy_json" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "max_session_seconds" {
  type    = number
  default = 3600
}
