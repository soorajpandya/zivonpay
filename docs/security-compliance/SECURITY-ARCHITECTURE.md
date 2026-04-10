# ZivonPay Security Architecture

**Version**: 1.0  
**Last Updated**: 2024

---

## 1. Overview

ZivonPay is a Payment Aggregator platform that sits between merchants and the SprintNXT UPI payment gateway. This document describes the security architecture designed to protect payment data and maintain PCI-DSS compliance.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MERCHANT LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Merchant 1│  │Merchant 2│  │Merchant 3│  │Merchant N│      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │              │             │             │
│       └─────────────┴──────────────┴─────────────┘             │
│                          │ HTTPS/TLS 1.3                       │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NETWORK SECURITY LAYER                       │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ AWS WAF                                                     ││
│  │ - Rate Limiting (2000 req/min per IP)                      ││
│  │ - SQL Injection Protection                                 ││
│  │ - XSS Protection                                            ││
│  │ - OWASP Core Rule Set                                       ││
│  └────────────────────────────────────────────────────────────┘│
│                           │                                     │
│  ┌────────────────────────▼───────────────────────────────────┐│
│  │ Application Load Balancer (ALB)                            ││
│  │ - TLS 1.3 Termination                                      ││
│  │ - HTTP Strict Transport Security (HSTS)                    ││
│  │ - Health Checks                                             ││
│  │ - Access Logs → S3                                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER (VPC)                       │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ ECS Fargate Tasks (Private Subnets)                        ││
│  │ ┌──────────────────────────────────────────────────────┐  ││
│  │ │ FastAPI Application                                   │  ││
│  │ │ - HTTP Basic Auth (bcrypt)                            │  ││
│  │ │ - Request ID Middleware                               │  ││
│  │ │ - Rate Limiting (Redis-backed)                        │  ││
│  │ │ - Structured JSON Logging                             │  ││
│  │ │ - Exception Handlers                                  │  ││
│  │ └──────────────────────────────────────────────────────┘  ││
│  │                                                              ││
│  │ Security Groups:                                             ││
│  │ - Ingress: ALB only on port 8000                            ││
│  │ - Egress: RDS, Redis, SprintNXT API                         ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
           │                                │
           │                                │
           ▼                                ▼
┌──────────────────────┐      ┌──────────────────────────┐
│   DATA LAYER         │      │   CACHE LAYER            │
│  ┌────────────────┐  │      │  ┌────────────────────┐  │
│  │ RDS PostgreSQL │  │      │  │ ElastiCache Redis  │  │
│  │ (Private Subnet)│  │      │  │ (Private Subnet)   │  │
│  │                 │  │      │  │                    │  │
│  │ - Multi-AZ      │  │      │  │ - In-transit TLS   │  │
│  │ - Encrypted     │  │      │  │ - At-rest encrypt  │  │
│  │ - Automated     │  │      │  │ - Rate limit store │  │
│  │   Backups       │  │      │  │ - Session cache    │  │
│  │ - Audit Logs    │  │      │  └────────────────────┘  │
│  └────────────────┘  │      └──────────────────────────┘
└──────────────────────┘
           │
           │ (ECS outbound to internet via NAT Gateway)
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   UPSTREAM INTEGRATION                          │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ SprintNXT UPI API (External)                               ││
│  │ - HTTPS with Client-id and Token headers                   ││
│  │ - Circuit breaker for failures                             ││
│  │ - Exponential backoff retry                                ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Network Security

### 3.1 VPC Design

**Architecture**:
- **Public Subnets** (3 AZs): Application Load Balancer only
- **Private Subnets** (3 AZs): ECS tasks, RDS, ElastiCache
- **NAT Gateways** (3 AZs): Outbound internet for ECS tasks (SprintNXT API calls)
- **Internet Gateway**: Inbound traffic to ALB

**Network Segmentation**:
```
10.0.0.0/16 (VPC)
├── 10.0.0.0/24 - Public Subnet AZ-A (ALB)
├── 10.0.1.0/24 - Public Subnet AZ-B (ALB)
├── 10.0.2.0/24 - Public Subnet AZ-C (ALB)
├── 10.0.10.0/24 - Private Subnet AZ-A (ECS/RDS/Redis)
├── 10.0.11.0/24 - Private Subnet AZ-B (ECS/RDS/Redis)
└── 10.0.12.0/24 - Private Subnet AZ-C (ECS/RDS/Redis)
```

### 3.2 Security Groups (Firewall Rules)

**ALB Security Group**:
```
Ingress:
- Port 443 from 0.0.0.0/0 (HTTPS)
- Port 80 from 0.0.0.0/0 (HTTP redirect to HTTPS)

Egress:
- Port 8000 to ECS Security Group
```

**ECS Security Group**:
```
Ingress:
- Port 8000 from ALB Security Group only

Egress:
- Port 5432 to RDS Security Group (PostgreSQL)
- Port 6379 to Redis Security Group
- Port 443 to 0.0.0.0/0 (SprintNXT API, AWS services)
```

**RDS Security Group**:
```
Ingress:
- Port 5432 from ECS Security Group only

Egress: None
```

**Redis Security Group**:
```
Ingress:
- Port 6379 from ECS Security Group only

Egress: None
```

### 3.3 Network Monitoring

- **VPC Flow Logs**: All traffic logged to CloudWatch
- **Network ACLs**: Default allow (security groups provide defense)
- **AWS GuardDuty**: Threat detection for VPC (recommended)

---

## 4. Data Security

### 4.1 Encryption at Rest

**Database Encryption**:
- RDS PostgreSQL with AWS KMS encryption
- Encrypted automated backups
- Encrypted snapshots
- Application-level encryption for sensitive fields:
  ```sql
  encrypted_customer_name BYTEA  -- AES-256 Fernet cipher
  encrypted_customer_mobile BYTEA
  encrypted_customer_email BYTEA
  encrypted_payer_vpa BYTEA
  ```

**Cache Encryption**:
- ElastiCache Redis with at-rest encryption
- No PII stored in cache (rate limiting data only)

**File Storage**:
- S3 buckets with default encryption (AES-256)
- Versioning enabled for backups and logs

### 4.2 Encryption in Transit

**External Connections**:
- ALB enforces TLS 1.3: `ELBSecurityPolicy-TLS13-1-2-2021-06`
- Certificate from AWS Certificate Manager
- HTTP redirected to HTTPS (301)
- HSTS header: `max-age=31536000; includeSubDomains`

**Internal Connections**:
- RDS PostgreSQL: TLS enforced via parameter group
- ElastiCache Redis: Transit encryption enabled
- ECS to SprintNXT: HTTPS only

### 4.3 Encryption Implementation

**Application-Layer Encryption**:
```python
from cryptography.fernet import Fernet

class EncryptionService:
    def __init__(self, key: bytes):
        self.cipher = Fernet(key)  # AES-256
    
    def encrypt(self, plaintext: str) -> bytes:
        return self.cipher.encrypt(plaintext.encode())
    
    def decrypt(self, ciphertext: bytes) -> str:
        return self.cipher.decrypt(ciphertext).decode()
```

**Key Management**:
- Encryption keys stored in AWS Secrets Manager
- Key rotation every 180 days
- Application retrieves key at startup
- No keys in code or environment variables visible in logs

---

## 5. Authentication and Authorization

### 5.1 Merchant Authentication

**HTTP Basic Auth**:
```
Authorization: Basic base64(key_id:key_secret)
```

**API Key Generation**:
```python
import secrets

key_id = f"zp_{'test' if sandbox else 'live'}_{secrets.token_urlsafe(16)}"
key_secret = secrets.token_urlsafe(32)  # 256 bits
key_secret_hash = bcrypt.hashpw(key_secret.encode(), bcrypt.gensalt(rounds=12))
```

**Key Storage**:
- `key_id`: Plaintext in database (indexed)
- `key_secret`: Bcrypt hash (cost factor 12) in database
- Original `key_secret` shown once at creation, then never stored

### 5.2 Service-to-Service Authentication

**ECS to RDS**:
- Database username/password in Secrets Manager
- IAM authentication (optional enhancement)

**ECS to SprintNXT**:
- `Client-id` and `Token` headers from Secrets Manager
- TLS client certificate (if required by SprintNXT)

**ECS to AWS Services**:
- IAM role attached to ECS task
- No long-lived credentials

### 5.3 Authorization Model

**Principle**: Every merchant can only access their own data

**Implementation**:
```python
@router.get("/orders/{order_id}")
async def get_order(
    order_id: UUID,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    order = await order_service.get_order(db, order_id)
    
    # Authorization check
    if order.merchant_id != merchant.id:
        raise UnauthorizedException("Access denied")
    
    return order
```

---

## 6. Application Security

### 6.1 Input Validation

**Pydantic Schemas**:
```python
class OrderCreateRequest(BaseModel):
    amount: int = Field(..., gt=0, le=1000000)  # Max 10,000 INR
    currency: str = Field(..., regex="^INR$")
    receipt: str = Field(..., min_length=1, max_length=40)
    customer: CustomerInfo
    notes: Optional[Dict[str, Any]] = Field(default={}, max_length=15)
```

**SQL Injection Prevention**:
- SQLAlchemy ORM with parameterized queries
- No raw SQL except in migrations (reviewed)

**XSS Prevention**:
- API returns JSON only (no HTML)
- Content-Type validation
- No user-generated content rendered

### 6.2 Rate Limiting

**Implementation**:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://redis:6379"
)

@router.post("/orders")
@limiter.limit("1000/minute")  # Per IP
async def create_order(...):
    ...
```

**Limits**:
- Order creation: 1000/minute per IP
- Order fetch: 5000/minute per IP
- Authentication failures: 10/minute per IP → lockout

### 6.3 Webhook Security

**Signature Generation**:
```python
def create_webhook_signature(payload: str, timestamp: int, secret: str) -> str:
    signed_payload = f"{timestamp}.{payload}"
    signature = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return signature
```

**Merchant Verification**:
```javascript
// Merchant webhook endpoint
const crypto = require('crypto');

function verifySignature(payload, signature, timestamp, secret) {
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}
```

**Replay Protection**:
- Timestamp in signature (must be within 5 minutes)
- Idempotency: Webhook delivery tracked, not re-sent if acknowledged

### 6.4 Error Handling

**No Information Disclosure**:
```python
@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # Return generic error to client
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "description": "An internal error occurred",
                "source": "api"
            }
        }
    )
```

**Detailed Logging** (internal only):
- Full stack traces in CloudWatch
- Request ID for correlation
- No sensitive data in logs (PII, passwords)

---

## 7. Infrastructure Security

### 7.1 Container Security

**Docker Image**:
```dockerfile
# Multi-stage build
FROM python:3.11-slim AS builder
# Build dependencies

FROM gcr.io/distroless/python3-debian11
# Minimal attack surface, no shell

USER nonroot:nonroot  # Non-root user
WORKDIR /app
COPY --from=builder /app /app
```

**Image Scanning**:
- AWS ECR vulnerability scanning
- Trivy scanner in CI/CD pipeline
- Block deployment if critical vulnerabilities

### 7.2 ECS Security

**Task Definition**:
- No privileged mode
- Read-only root filesystem (where possible)
- Secrets via environment variables from Secrets Manager
- No host port mapping (awsvpc network mode)

**Task Role** (least privilege):
```json
{
  "Effect": "Allow",
  "Action": [
    "secretsmanager:GetSecretValue"
  ],
  "Resource": "arn:aws:secretsmanager:*:*:secret:zivonpay-prod-*"
}
```

### 7.3 Secrets Management

**AWS Secrets Manager**:
```json
{
  "db_password": "randomly_generated_32_char",
  "sprintnxt_client_id": "merchant_sprintnxt_client",
  "sprintnxt_token": "merchant_sprintnxt_token",
  "encryption_key": "base64_encoded_32_bytes"
}
```

**Automatic Rotation**:
- RDS password: 90 days (Lambda rotation function)
- Encryption key: 180 days (manual with downtime window)
- SprintNXT credentials: Per vendor requirements

---

## 8. Monitoring and Logging

### 8.1 Security Monitoring

**CloudWatch Alarms**:
- Failed authentication attempts > 10/minute
- 5xx errors > 10/5 minutes
- CPU/memory utilization > 85%
- Unhealthy target count < 1
- WAF blocked requests > threshold

**VPC Flow Logs**:
- Detect unusual traffic patterns
- Identify port scans
- Monitor data exfiltration attempts

**CloudTrail**:
- All AWS API calls logged
- Detect unauthorized infrastructure changes
- Monitor IAM policy modifications

### 8.2 Application Logging

**Structured JSON Logs**:
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "INFO",
  "request_id": "uuid",
  "merchant_id": "merchant_uuid",
  "endpoint": "/v1/orders",
  "method": "POST",
  "status_code": 201,
  "duration_ms": 145,
  "ip_address": "1.2.3.4"
}
```

**What's Logged**:
- All API requests (request ID, merchant, endpoint, status)
- Authentication attempts (success/failure)
- Database queries (sanitized, no data values)
- Webhook deliveries (status, retry count)
- Errors and exceptions (stack trace)

**What's NOT Logged**:
- API keys, passwords, tokens
- Unencrypted PII (customer names, mobile, VPA)
- Full request bodies (may contain sensitive data)

### 8.3 Audit Trail

**Database Audit Logs**:
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    merchant_id UUID,
    action VARCHAR(50),  -- 'order.created', 'payment.captured'
    resource_type VARCHAR(50),
    resource_id UUID,
    changes JSONB,  -- Before/after values (sanitized)
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ
);
```

**Retention**: 7 years (compliance requirement)

---

##9. Incident Response

### 9.1 Detection

**Automated Alerts**:
- PagerDuty integration for critical alarms
- Slack notifications for warnings
- Email digest for informational

### 9.2 Response Procedures

**Critical Incident** (database breach):
1. Isolate affected systems (modify security groups)
2. Preserve forensic evidence (snapshots, logs)
3. Rotate all credentials
4. Notify legal and compliance teams
5. Customer communication (if data exposed)

**Service Disruption** (DDoS attack):
1. Enable WAF rate limiting rules
2. Scale ECS tasks (autoscaling)
3. Contact AWS Shield support (if using Shield Advanced)
4. Analyze attack patterns and update WAF

**Detailed Procedures**: See `docs/security-compliance/INCIDENT-RESPONSE.md`

---

## 10. Compliance and Auditing

### 10.1 PCI-DSS Compliance

**SAQ A-EP** (recommended classification):
- Merchant data encrypted in database
- No card data stored (UPI payment method)
- TLS for all connections
- Annual penetration testing
- Quarterly vulnerability scans

**Controls Implemented**:
- Network segmentation (VPC)
- Encryption at rest and in transit
- Access control (authentication, authorization)
- Logging and monitoring
- Incident response procedures

**Evidence Location**: `docs/security-compliance/PCI-DSS-CHECKLIST.md`

### 10.2 ISO 27001

**Implemented Controls**:
- A.9: Access Control
- A.10: Cryptography
- A.12: Operations Security
- A.13: Communications Security
- A.14: System Acquisition and Development
- A.16: Incident Management
- A.17: Business Continuity

**Evidence Location**: `docs/security-compliance/ISO-27001-CONTROLS.md`

### 10.3 Audit Support

**Audit Artifacts**:
- Terraform code (infrastructure as code)
- CloudWatch logs (30 days hot, 365 days archived)
- Database audit logs (7 years)
- Security policies and procedures
- Penetration test reports
- Vulnerability scan results

---

## 11. Business Continuity

### 11.1 High Availability

**Multi-AZ Deployment**:
- ECS tasks across 3 availability zones
- RDS Multi-AZ (automatic failover)
- ElastiCache Multi-AZ (production)
- ALB across 3 availability zones

**Uptime Target**: 99.9% (43.8 minutes downtime/month)

### 11.2 Backup and Recovery

**Database Backups**:
- Automated daily backups (30-day retention)
- Manual snapshots before major changes
- Cross-region backup replication (production)
- RPO: 1 hour, RTO: 4 hours

**Application**:
- Immutable container images in ECR
- Terraform state in S3 with versioning
- Git repository (code)

**Recovery Procedures**:
1. RDS restore from snapshot
2. Deploy last known good container image
3. Verify data integrity
4. Resume traffic

---

## 12. Future Enhancements

### Short-term (3-6 months)
- [ ] Implement AWS WAF regional rate limiting per API endpoint
- [ ] Enable AWS GuardDuty for threat detection
- [ ] Add Secrets Manager automatic rotation for all secrets
- [ ] Implement AWS Config for compliance-as-code

### Medium-term (6-12 months)
- [ ] Multi-region active-passive deployment
- [ ] Enhanced DDoS protection with AWS Shield Advanced
- [ ] Implement AWS Security Hub for centralized security findings
- [ ] Add fraud detection ML model

### Long-term (12+ months)
- [ ] Zero Trust Network Architecture with AWS PrivateLink
- [ ] Hardware Security Module (HSM) for key management
- [ ] Advanced threat detection with SIEM integration
- [ ] Automated compliance evidence collection

---

## 13. Security Contact

**Security Team**: security@zivonpay.com  
**Vulnerability Disclosure**: security@zivonpay.com  
**24/7 Incident Hotline**: [Phone number]

**Bug Bounty Program**: [If implemented]

---

**Document Classification**: Internal Use Only  
**Last Reviewed**: 2024
