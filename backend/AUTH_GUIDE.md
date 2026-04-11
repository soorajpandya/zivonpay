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

### 3. HMAC Request Signing (Optional — Recommended for Production)

When request signing is enabled for your merchant account, every API request must include two additional headers:

| Header | Value |
|--------|-------|
| `x-timestamp` | Unix epoch in seconds (e.g. `1712764800`) |
| `x-signature` | HMAC-SHA256 hex digest of the canonical string |

**Canonical String Format:**
```
METHOD\nPATH\nSHA256(body)\nTIMESTAMP
```

**Example (Python):**
```python
import hashlib, hmac, time, json, requests

SIGNING_SECRET = "zp_signing_test_xxxxxxxxxxxxxxxx"  # From Dashboard
KEY_ID = "key_test_abc123"
KEY_SECRET = "sec_test_xyz789_keep_this_secret"

def sign_request(method: str, path: str, body: dict | None = None):
    timestamp = str(int(time.time()))
    body_str = json.dumps(body, separators=(',', ':')) if body else ''
    body_hash = hashlib.sha256(body_str.encode()).hexdigest()

    canonical = f"{method}\n{path}\n{body_hash}\n{timestamp}"
    signature = hmac.new(
        SIGNING_SECRET.encode(), canonical.encode(), hashlib.sha256
    ).hexdigest()

    return {'x-timestamp': timestamp, 'x-signature': signature}

# Create signed order
body = {"amount": 10000, "currency": "INR", "receipt": "order_001"}
headers = sign_request("POST", "/v1/orders", body)

resp = requests.post(
    "https://api.zivonpay.com/v1/orders",
    auth=(KEY_ID, KEY_SECRET),
    headers={**headers, "Content-Type": "application/json"},
    json=body,
)
```

**Example (Node.js):**
```javascript
const crypto = require('crypto');

function signRequest(method, path, body, signingSecret) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyStr = body ? JSON.stringify(body) : '';
  const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex');

  const canonical = `${method}\n${path}\n${bodyHash}\n${timestamp}`;
  const signature = crypto
    .createHmac('sha256', signingSecret)
    .update(canonical)
    .digest('hex');

  return { timestamp, signature };
}
```

**Rules:**
- Timestamp must be within **±5 minutes** of server time
- Each signature can only be used **once** (replay protection)
- Signing secret is provided when you enable request signing in the Dashboard

## Multi-Layered Security

ZivonPay supports 8 security layers, configurable per merchant:

| # | Layer | Required Headers | Default |
|---|-------|-----------------|---------|
| 1 | Origin / Domain Check | `Origin` or `Referer` | Off |
| 2 | IP Whitelist (CIDR) | `X-Real-IP` / `X-Forwarded-For` | Off |
| 3 | mTLS Certificate | `X-Client-Cert-Subject` | Off |
| 4 | API Key Auth (Basic) | `Authorization: Basic ...` | **Always On** |
| 5 | HMAC-SHA256 Signing | `x-timestamp`, `x-signature` | Off |
| 6 | Replay Protection | (uses x-signature) | Auto with signing |
| 7 | Rate Limiting | — | On (per key + IP) |
| 8 | Device Fingerprint | `x-device-id` (optional) | Off |

Enable security layers in the Dashboard under **Settings → API Security**, or via the security config API.

### IP Whitelisting

Supports individual IPs and CIDR ranges:
```json
{
  "enforce_ip_check": true,
  "whitelisted_ips": ["203.0.113.0/24", "198.51.100.42"]
}
```

### Domain Whitelisting

Supports exact matches and wildcards:
```json
{
  "enforce_domain_check": true,
  "whitelisted_domains": ["*.mysite.com", "checkout.partner.com"]
}
```

### Security Audit Log

All security events (auth success, IP blocked, signature invalid, replay detected, etc.) are recorded in a tamper-resistant, hash-chained audit log. Each record's hash references the previous record, making the chain verifiable.

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

### 4. Create Payment Link
```bash
curl -X POST http://localhost:8000/v1/payment-intent \
  -u "key_test_abc:sec_test_xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100000,
    "order_id": "ORD_TEST_001",
    "customer_name": "Suraj Pandya",
    "customer_phone": "9999999999",
    "customer_email": "suraj@example.com",
    "expiry_minutes": 30
  }'
```

**Response:**
```json
{
  "status": "success",
  "payment_intent_id": "pi_a1b2c3d4e5f6",
  "payment_link": "https://api.zivonpay.com/link/pi_a1b2c3d4e5f6?token=eyJ...",
  "amount": 100000,
  "currency": "INR",
  "order_id": "ORD_TEST_001",
  "intent_status": "created",
  "expires_at": "2026-04-10T15:30:00Z"
}
```

Share the `payment_link` URL with your customer. They'll see a hosted checkout page with a UPI QR code.

### 5. Get Payment Link Status
```bash
curl -X GET http://localhost:8000/v1/payment-intent/pi_a1b2c3d4e5f6 \
  -u "key_test_abc:sec_test_xyz"
```

### 6. List Payment Links
```bash
curl "http://localhost:8000/v1/payment-intent?skip=0&limit=20" \
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
