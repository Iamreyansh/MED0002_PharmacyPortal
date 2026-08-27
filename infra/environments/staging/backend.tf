terraform {
  backend "s3" {
    bucket       = "terraform-locks-105927215604"
    key          = "MED0002/staging/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true
  }
}
