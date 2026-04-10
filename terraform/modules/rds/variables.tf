variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
}

variable "db_subnet_ids" {
  description = "List of subnet IDs for DB subnet group"
  type        = list(string)
}

variable "db_security_group_id" {
  description = "Security group ID for RDS"
  type        = string
}
