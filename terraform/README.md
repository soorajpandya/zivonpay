# ZivonPay Infrastructure - Terraform

This directory contains Terraform modules for deploying ZivonPay infrastructure on AWS.

## Architecture

- **Network**: VPC with public/private subnets across 3 AZs
- **Compute**: ECS Fargate for container orchestration
- **Database**: RDS PostgreSQL 16 Multi-AZ with encryption
- **Cache**: ElastiCache Redis 7 with encryption in-transit/at-rest
- **Load Balancer**: ALB with TLS 1.3, HSTS, WAF protection
- **Secrets**: AWS Secrets Manager for credentials
- **Monitoring**: CloudWatch Logs, Metrics, Alarms
- **Autoscaling**: Target tracking based on CPU/memory

## Prerequisites

- Terraform >= 1.6
- AWS CLI configured with appropriate credentials
- Route53 hosted zone for domain

## Usage

```bash
cd terraform/environments/sandbox

# Initialize
terraform init

# Plan
terraform plan -var-file=sandbox.tfvars

# Apply
terraform apply -var-file=sandbox.tfvars
```

## Environments

- **sandbox**: Development/testing environment
- **production**: Production environment with enhanced security and HA

## Security Features

- VPC with private subnets for database/cache
- Security groups with least privilege
- Encryption at rest for RDS and ElastiCache
- Encryption in transit (TLS 1.3)
- WAF with rate limiting and SQL injection protection
- Secrets Manager for credential rotation
- CloudTrail for audit logging
- VPC Flow Logs for network monitoring
