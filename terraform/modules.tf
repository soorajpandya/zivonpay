# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security-groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# RDS PostgreSQL Module
module "rds" {
  source = "./modules/rds"

  project_name         = var.project_name
  environment          = var.environment
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_subnet_ids        = module.vpc.private_subnet_ids
  db_security_group_id = module.security_groups.rds_sg_id
}

# ElastiCache Redis Module
module "redis" {
  source = "./modules/redis"

  project_name           = var.project_name
  environment            = var.environment
  redis_node_type        = var.redis_node_type
  redis_num_cache_nodes  = var.redis_num_cache_nodes
  redis_subnet_ids       = module.vpc.private_subnet_ids
  redis_security_group_id = module.security_groups.redis_sg_id
}

# Secrets Manager
module "secrets" {
  source = "./modules/secrets"

  project_name         = var.project_name
  environment          = var.environment
  sprintnxt_client_id  = var.sprintnxt_client_id
  sprintnxt_token      = var.sprintnxt_token
  encryption_key       = var.encryption_key
  db_password          = module.rds.db_password
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  project_name             = var.project_name
  environment              = var.environment
  vpc_id                   = module.vpc.vpc_id
  public_subnet_ids        = module.vpc.public_subnet_ids
  alb_security_group_id    = module.security_groups.alb_sg_id
  certificate_arn          = var.certificate_arn
}

# WAF
module "waf" {
  source = "./modules/waf"

  project_name  = var.project_name
  environment   = var.environment
  alb_arn       = module.alb.arn
}

# ECS Cluster and Service
module "ecs" {
  source = "./modules/ecs"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  ecs_security_group_id = module.security_groups.ecs_sg_id
  target_group_arn      = module.alb.target_group_arn
  
  task_cpu           = var.ecs_task_cpu
  task_memory        = var.ecs_task_memory
  desired_count      = var.ecs_desired_count
  min_capacity       = var.ecs_min_capacity
  max_capacity       = var.ecs_max_capacity
  
  db_host            = module.rds.endpoint
  redis_host         = module.redis.endpoint
  secrets_arn        = module.secrets.secret_arn
}

# CloudWatch Alarms
module "monitoring" {
  source = "./modules/monitoring"

  project_name      = var.project_name
  environment       = var.environment
  ecs_cluster_name  = module.ecs.cluster_name
  ecs_service_name  = module.ecs.service_name
  alb_arn_suffix    = module.alb.arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix
}
