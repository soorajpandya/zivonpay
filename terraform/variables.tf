variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment name (sandbox or production)"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "zivonpay"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 100
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.small"
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 1
}

variable "ecs_task_cpu" {
  description = "ECS task CPU units"
  type        = string
  default     = "1024"
}

variable "ecs_task_memory" {
  description = "ECS task memory in MB"
  type        = string
  default     = "2048"
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum ECS tasks for autoscaling"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Maximum ECS tasks for autoscaling"
  type        = number
  default     = 10
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN for TLS"
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
  description = "32-byte encryption key for AES-256"
  type        = string
  sensitive   = true
}
