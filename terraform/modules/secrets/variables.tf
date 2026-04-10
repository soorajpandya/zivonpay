variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "sprintnxt_client_id" {
  description = "SprintNXT Client ID"
  type        = string
  sensitive   = true
}

variable "sprintnxt_token" {
  description = "SprintNXT Token"
  type        = string
  sensitive   = true
}

variable "encryption_key" {
  description = "Encryption key"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}
