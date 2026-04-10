variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
}

variable "redis_subnet_ids" {
  description = "List of subnet IDs for Redis subnet group"
  type        = list(string)
}

variable "redis_security_group_id" {
  description = "Security group ID for Redis"
  type        = string
}
