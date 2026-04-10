# Authentication Guide - ZivonPay API

## Quick Start

### 1. Start the Application

Make sure PostgreSQL and Redis are running, then start the API:

```bash
cd backend
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### 2. Merchant Signup

Register a new merchant account:

```bash
curl -X POST http://localhost:8000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "My Business",
    "email": "business@example.com",
    "mobile": "+919876543210",
    "password": "SecurePass123!",
    "webhook_url": "https://example.com/webhook"
  }'
```

**Response:**
```json
{
  "merchant": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "business_name": "My Business",
    "email": "business@example.com",
    "mobile": "+919876543210",
    "api_key_id": "key_test_abc123",
    "environment": "sandbox",
    "is_active": true,
    "is_verified": false,
    "webhook_url": "https://example.com/webhook",
    "created_at": "2026-03-02T10:00:00Z"
  },
  "api_secret": "sec_test_xyz789_keep_this_secret",
  "webhook_secret": "whsec_test_abc123_keep_this_secret",
  "auth": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

**⚠️ Important:** Save the `api_secret` and `webhook_secret` - they are shown only once!

### 3. Merchant Login

Authenticate with your email and password:

```bash
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "business@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

## Using API Credentials

### For API Calls (Orders, Payments)

Use HTTP Basic Authentication with your API credentials:

```bash
# Format: key_id:secret
curl -X POST http://localhost:8000/v1/orders \
  -u "key_test_abc123:sec_test_xyz789_keep_this_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency": "INR",
    "receipt": "order_001",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "+919876543210"
    }
  }'
```

### For Dashboard/Web Access

Use JWT Bearer token from login:

```bash
curl -X GET http://localhost:8000/v1/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Authentication Methods

### 1. API Key Authentication (Basic Auth)
- **Use for:** API integrations, server-to-server calls
- **Format:** `Authorization: Basic base64(key_id:secret)`
- **Credentials:** From signup response (`api_key_id` + `api_secret`)

### 2. JWT Token Authentication (Bearer)
- **Use for:** Dashboard, web applications
- **Format:** `Authorization: Bearer <token>`
- **Token:** From login response (`access_token`)
- **Expiry:** 1 hour (3600 seconds)

## API Documentation

Once the server is running, access:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Setup Database

If you haven't set up PostgreSQL yet:

### Using Docker Compose

```bash
cd backend
docker-compose up -d postgres redis
```

### Manual Setup

```bash
# Create database
createdb zivonpay_sandbox

# Run schema
psql -d zivonpay_sandbox -f schema.sql
```

Then update `.env`:
```env
DATABASE_URL=postgresql+asyncpg://your_user:your_password@localhost:5432/zivonpay_sandbox
```

## Environment Variables

Key environment variables in `.env`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://zivonpay:password@localhost:5432/zivonpay_sandbox

# Redis
REDIS_URL=redis://localhost:6379/0

# SprintNXT Credentials
SPRINTNXT_BASE_URL=https://nxt-nonprod.sprintnxt.in/NonProdNextgenAPIExpose/api/v2/UPIService/UPI
SPRINTNXT_CLIENT_ID=your_client_id
SPRINTNXT_TOKEN=your_token

# Security (auto-generated)
JWT_SECRET_KEY=<generated>
ENCRYPTION_KEY=<generated>
```

## Testing the API

### 1. Signup
```bash
curl -X POST http://localhost:8000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"business_name":"Test Store","email":"test@example.com","password":"Test123!"}'
```

### 2. Create Order
```bash
curl -X POST http://localhost:8000/v1/orders \
  -u "key_test_abc:sec_test_xyz" \
  -H "Content-Type: application/json" \
  -d '{"amount":10000,"currency":"INR","receipt":"order_001"}'
```

### 3. Check Order Status
```bash
curl -X GET http://localhost:8000/v1/orders/{order_id} \
  -u "key_test_abc:sec_test_xyz"
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Store API secrets securely** (use environment variables or secret managers)
3. **Use HTTPS** in production
4. **Rotate API keys** periodically
5. **Validate webhook signatures** using HMAC-SHA256
6. **Keep JWT tokens** short-lived (1 hour default)

## Troubleshooting

### Database Connection Failed
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Ensure database exists: `psql -l`

### Redis Connection Failed
- Check Redis is running: `redis-cli ping`
- Verify REDIS_URL in `.env`

### Authentication Failed
- Verify API credentials match signup response
- Check if account is active: `is_active: true`
- Ensure password meets requirements (min 8 characters)

## Support

For issues or questions:
- Email: soora@zivonpay.com
- GitHub: https://github.com/zivonpay/api
