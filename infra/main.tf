terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.58"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

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

variable "github_org" {
  type    = string
  default = "Iamreyansh"
}

variable "github_org_id" {
  type    = string
  default = "43453546"
}

variable "github_repo" {
  type    = string
  default = "MED0002_PharmacyPortal"
}

variable "github_repo_id" {
  type    = string
  default = "1309166870"
}

variable "project_name" {
  type    = string
  default = "med0002-pharmacy-portal"
}

variable "tf_state_bucket" {
  type    = string
  default = "terraform-locks-105927215604"
}

data "aws_caller_identity" "current" {}

data "aws_route53_zone" "primary" {
  name         = var.root_domain
  private_zone = false
}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

locals {
  bucket_name = "${var.project_name}-${data.aws_caller_identity.current.account_id}"
}
