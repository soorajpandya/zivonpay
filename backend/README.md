# 🚀 ZivonPay - Payment Aggregator Backend

## Overview

ZivonPay is a production-grade, PCI-DSS structured Payment Aggregator platform that provides a clean REST API for UPI payments, internally mapping to SprintNXT UPI infrastructure.

## Features

✅ **Production-Ready Architecture**
- FastAPI with async/await
- PostgreSQL with SQLAlchemy ORM
- Redis for caching and rate limiting
- Docker containerization

✅ **Security First**
- TLS 1.3 enforcement
- API key authentication (Basic Auth)
- AES-256 encryption for sensitive data
- HMAC-SHA256 webhook signatures
- PCI-DSS compliant structure

✅ **Enterprise Features**
- Rate limiting (Redis-backed)
- Idempotency support
- Webhook system with retry logic
- Structured JSON logging
- Prometheus metrics
- Request tracing

✅ **Environment Isolation**
- Separate sandbox & production
- Environment-specific credentials
- Isolated databases and caches

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+

### Local Development

1. **Clone and Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Dependencies**
```bash
docker-compose up -d postgres redis
```

4. **Run Migrations**
```bash
alembic upgrade head
```

5. **Start Server**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Deployment

```bash
docker-compose up -d
```

## API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Orders

- `POST /v1/orders` - Create a new order and generate UPI intent
- `GET /v1/orders/:id` - Fetch order status
- `GET /v1/orders` - List all orders (merchant-specific)

### Payments

- `GET /v1/payments/:id` - Fetch payment details
- `GET /v1/payments` - List all payments

## Authentication

All API requests require HTTP Basic Authentication:

```bash
Authorization: Basic base64(key_id:key_secret)
```

**Sandbox Keys**: `zp_test_xxxxx`
**Production Keys**: `zp_live_xxxxx`

## Environment Variables

See `.env.example` for all configuration options.

### Critical Variables

- `SPRINTNXT_CLIENT_ID` - SprintNXT client ID
- `SPRINTNXT_TOKEN` - SprintNXT authentication token
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `ENCRYPTION_KEY` - AES-256 encryption key (32 bytes)

## Database Schema

Run migrations:
```bash
alembic upgrade head
```

Create new migration:
```bash
alembic revision --autogenerate -m "description"
```

## Testing

```bash
pytest
pytest --cov=app tests/
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /v1/orders | 1000/min |
| GET /v1/orders/:id | 5000/min |

## Webhook Events

- `payment.captured` - Payment successfully captured
- `payment.failed` - Payment failed
- `order.paid` - Order marked as paid

## Security Compliance

- **PCI-DSS**: Data encryption, secure key storage, audit logging
- **ISO 27001**: RBAC, access controls, incident management

## Monitoring

- **Prometheus**: http://localhost:9090
- **Logs**: Structured JSON logs in `logs/` directory
- **Metrics**: `/metrics` endpoint

## Production Deployment

1. Use production environment file
2. Enable TLS/SSL (Let's Encrypt recommended)
3. Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
4. Use managed Redis (AWS ElastiCache, Redis Cloud)
5. Store secrets in Vault (HashiCorp Vault, AWS Secrets Manager)
6. Enable WAF protection
7. Configure auto-scaling
8. Set up monitoring and alerting

## Support

For issues and questions:
- Documentation: `/docs`
- API Status: https://status.zivonpay.com
- Support: support@zivonpay.com
