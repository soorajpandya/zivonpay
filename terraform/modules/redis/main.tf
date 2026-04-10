resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-redis-subnet"
  subnet_ids = var.redis_subnet_ids

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-subnet-group"
  }
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${var.project_name}-${var.environment}-redis"
  engine               = "redis"
  engine_version       = "7.1"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.main.name
  port                 = 6379
  
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [var.redis_security_group_id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  snapshot_retention_limit = var.environment == "production" ? 5 : 1
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:07:00"
  
  tags = {
    Name = "${var.project_name}-${var.environment}-redis"
  }
}

resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.project_name}-${var.environment}-redis-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-redis-params"
  }
}
