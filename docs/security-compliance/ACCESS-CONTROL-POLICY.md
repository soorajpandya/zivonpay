# ZivonPay Access Control Policy

**Document Version**: 1.0  
**Effective Date**: 2024  
**Review Cycle**: Annual

---

## 1. Purpose

This Access Control Policy defines the standards and procedures for managing access to ZivonPay systems, applications, and data to ensure confidentiality, integrity, and availability.

---

## 2. Scope

This policy applies to:
- All ZivonPay employees, contractors, and third-party service providers
- All systems hosting ZivonPay applications and data (AWS infrastructure, databases, etc.)
- Merchant API access via authentication keys
- Administrative access to production and sandbox environments

---

## 3. Principles

### 3.1 Least Privilege
Users are granted the minimum level of access required to perform their job functions.

### 3.2 Separation of Duties
Critical functions are divided among multiple users to prevent fraud and errors.

### 3.3 Need-to-Know
Access to sensitive data is restricted to users with legitimate business need.

### 3.4 Defense in Depth
Multiple layers of access control (network, application, data) protect resources.

---

## 4. User Access Management

### 4.1 User Lifecycle

**Provisioning** (New User):
1. Manager submits access request via ticketing system
2. HR confirms employment status
3. Security team reviews and approves based on role
4. IT provisions accounts with appropriate permissions
5. User completes security training before access granted
6. Access logged in user access registry

**Modification** (Role Change):
1. Manager submits access change request
2. Security reviews new access requirements
3. Old permissions revoked, new permissions granted
4. Change logged and user notified

**De-provisioning** (Termination/Exit):
1. HR initiates offboarding process
2. All accounts disabled immediately upon termination
3. API keys rotated if user had production access
4. Equipment returned and data wiped
5. Final access audit completed within 24 hours

### 4.2 Account Types

**Human Users**:
- **Developers**: Code repository, sandbox environment, read-only production logs
- **DevOps Engineers**: AWS infrastructure management, deployment permissions
- **Security Team**: Full access for security audits, incident response
- **Support Team**: Read-only merchant data, no write access to payment info
- **Executives**: Dashboard access, audit reports

**Service Accounts**:
- **ECS Task Execution Role**: Pull images, write logs, read secrets
- **ECS Task Role**: Access RDS, Redis, SprintNXT API
- **CI/CD Pipeline**: Deploy to sandbox, read-only production
- **Monitoring Services**: Read metrics and logs

**Merchant Accounts**:
- **API Keys**: Authentication for order creation, payment queries
- **Webhook Secrets**: Signature verification for webhooks

---

## 5. Authentication Standards

### 5.1 Human Authentication

**AWS Console Access**:
- []IAM users with strong passwords (min 16 characters, complexity requirements)
- **MFA required** for all users (hardware token or authenticator app)
- Session timeout: 12 hours
- Maximum 3 failed login attempts before lockout

**SSH/System Access**:
- SSH key-based authentication only (no passwords)
- AWS Systems Manager Session Manager for ECS container access
- All sessions logged to CloudTrail

**Code Repository**:
- GitHub SSO with MFA
- SSH keys for git operations
- Personal access tokens for automation (scoped, time-limited)

### 5.2 Machine Authentication

**Merchant API Authentication**:
- HTTP Basic Auth with API key (key_id:key_secret)
- API keys minimum 32 characters, cryptographically random
- Bcrypt hashing (12 rounds) for key storage
- Keys transmitted only over TLS 1.3

**Service-to-Service**:
- IAM roles for ECS tasks (no long-lived credentials)
- AWS Secrets Manager for third-party API tokens
- Automatic credential rotation where supported

### 5.3 Password Policy

**Requirements**:
- Minimum length: 16 characters
- Must contain: uppercase, lowercase, numbers, special characters
- Cannot contain: username, common words, keyboard patterns
- Password history: Last 12 passwords cannot be reused
- Maximum age: 90 days (180 days for service accounts)
- No sharing of passwords

**Storage**:
- All passwords hashed with bcrypt (cost factor 12)
- Never stored in plaintext
- Never logged or transmitted unencrypted

---

## 6. Authorization Model

### 6.1 Role-Based Access Control (RBAC)

**Defined Roles**:

| Role | Permissions | Example Users |
|------|------------|---------------|
| **Admin** | Full access to all systems | CTO, Security Lead |
| **DevOps** | AWS infrastructure, deployments | DevOps Engineers |
| **Developer** | Code repositories, sandbox environment | Software Engineers |
| **Support-L1** | Read merchant info, no payment data | Support Staff |
| **Support-L2** | Read payment data, refund operations | Senior Support |
| **Auditor** | Read-only all systems, audit logs | Compliance Team |
| **Merchant** | Own orders/payments via API | Merchant developers |

### 6.2 AWS IAM Policies

**Production Environment**:
```json
{
  "Effect": "Deny",
  "Action": [
    "rds:DeleteDBInstance",
    "rds:DeleteDBSnapshot",
    "s3:DeleteBucket"
  ],
  "Resource": "*"
}
```
*(All users denied destructive actions in production)*

**ECS Task Execution Role**:
```json
{
  "Effect": "Allow",
  "Action": [
    "ecr:GetAuthorizationToken",
    "ecr:BatchGetImage",
    "logs:CreateLogStream",
    "logs:PutLogEvents",
    "secretsmanager:GetSecretValue"
  ],
  "Resource": "arn:aws:secretsmanager:*:*:secret:zivonpay-prod-*"
}
```

**Developer Sandbox Access**:
```json
{
  "Effect": "Allow",
  "Action": [
    "ecs:*",
    "rds:Describe*",
    "logs:*"
  ],
  "Resource": "*",
  "Condition": {
    "StringEquals": {
      "aws:ResourceTag/Environment": "sandbox"
    }
  }
}
```

### 6.3 Database Access Control

**Application Database User** (ECS tasks):
```sql
CREATE USER zivonpay_app WITH PASSWORD '[from_secrets_manager]';
GRANT CONNECT ON DATABASE zivonpay TO zivonpay_app;
GRANT USAGE ON SCHEMA public TO zivonpay_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO zivonpay_app;
GRANT DELETE ON orders, payments, webhooks TO zivonpay_app;
-- No DELETE on merchants, api_keys, audit_logs
```

**Read-only Analyst User**:
```sql
CREATE USER zivonpay_analyst WITH PASSWORD '[generated]';
GRANT CONNECT ON DATABASE zivonpay TO zivonpay_analyst;
GRANT USAGE ON SCHEMA public TO zivonpay_analyst;
GRANT SELECT ON merchants, orders, payments TO zivonpay_analyst;
-- No access to encrypted fields: encrypted_customer_name, encrypted_vpa
```

**DBA User** (break-glass only):
```sql
-- Full superuser access
-- Usage logged and reviewed monthly
-- Requires approval ticket for production access
```

---

## 7. Access Reviews

### 7.1 Periodic Reviews

**Quarterly** (Human Users):
- All AWS IAM users reviewed by Security team
- Inactive accounts (>90 days no login) disabled
- Role assignments validated with managers
- Excessive permissions identified and removed

**Monthly** (Service Accounts):
- IAM roles reviewed for unused permissions
- API key usage analyzed for inactive merchants
- Secrets Manager secrets checked for rotation

**Weekly** (Critical Accounts):
- Admin/root account access logs reviewed
- Production database user activity audited
- Failed authentication attempts analyzed

### 7.2 Event-Triggered Reviews

- Upon employee termination
- After security incident
- Following major application changes
- When new compliance requirements arise

### 7.3 Review Documentation

All reviews documented with:
- Date of review
- Reviewer name
- Systems/accounts reviewed
- Findings and actions taken
- Approval signature

---

## 8. Privileged Access Management

### 8.1 Administrative Access

**Break-Glass Procedure** (Emergency Production Access):
1. Create support ticket with business justification
2. Security approves and logs access grant
3. Temporary elevated permissions granted (max 4 hours)
4. All actions logged to CloudTrail and audit_logs table
5. Access auto-revoked after time limit
6. Post-access review within 24 hours

**Root Account** (AWS):
- MFA with hardware token required
- No access keys created
- Used only for account recovery
- Usage alerts sent to security team immediately

### 8.2 Production Database Access

- No direct production database access for developers
- Changes deployed via Terraform/migration scripts
- Read-only access via AWS RDS Query Editor (logged)
- Emergency DBA access requires CTO approval

### 8.3 Secrets Management

**AWS Secrets Manager**:
- All production secrets stored in Secrets Manager
- Automatic rotation enabled where supported (RDS passwords)
- Access limited to ECS task execution role
- Manual rotation procedure for API keys (quarterly)

**Key Rotation Schedule**:
- Database passwords: 90 days (automatic)
- Encryption keys: 180 days (manual)
- SprintNXT API tokens: Per vendor requirements
- Merchant API keys: Recommended 180 days (merchant-initiated)

---

## 9. Network Access Control

### 9.1 Network Segmentation

**VPC Architecture**:
- Public subnets: ALB only (ports 80, 443)
- Private subnets: ECS tasks, RDS, Redis
- No direct internet access to private resources

**Security Groups**:
- ALB: Allow from 0.0.0.0/0 on 80/443
- ECS: Allow from ALB only on port 8000
- RDS: Allow from ECS security group only on port 5432
- Redis: Allow from ECS security group only on port 6379

### 9.2 Remote Access

**Corporate Network**:
- VPN required for accessing AWS console
- Split-tunnel VPN (only AWS traffic routed)
- VPN logs reviewed monthly

**Third-Party Access**:
- Separate AWS account for vendor testing
- No production access for third parties
- All vendor activity logged and monitored

---

## 10. Monitoring and Logging

### 10.1 Access Logging

**All access attempts logged**:
- CloudTrail: All AWS API calls
- CloudWatch Logs: Application authentication events
- Database audit logs: All SQL queries
- VPC Flow Logs: Network connections

**Log Retention**:
- Production: 30 days online, 365 days archived
- Sandbox: 7 days online, 90 days archived

### 10.2 Alerting

**Immediate Alerts** (PagerDuty):
- Failed authentication >5 attempts in 5 minutes
- Production database access by non-service accounts
- IAM policy changes in production
- Root account usage
- Secrets Manager access outside normal hours

**Daily Summary** (Email):
- Authentication summary report
- New user provisioning
- Permission changes
- Failed access attempts

---

## 11. Compliance and Exceptions

### 11.1 Policy Exceptions

Exceptions to this policy require:
1. Written business justification
2. Risk assessment by Security team
3. Compensating controls documented
4. CTO approval
5. Review every 6 months

### 11.2 Violations

Policy violations result in:
- First offense: Mandatory retraining
- Second offense: Written warning
- Third offense: Access revocation, possible termination
- Intentional/malicious: Immediate termination, legal action

---

## 12. Training and Awareness

### 12.1 Security Training

**Upon Hire**:
- Information security awareness training
- Access control policy review and acknowledgment
- Phishing simulation

**Annual Refresher**:
- Policy updates
- Common attack vectors
- Incident reporting procedures

### 12.2 Developer Training

**Secure Coding**:
- OWASP Top 10 awareness
- Authentication best practices
- Input validation and output encoding
- Secure secret handling (never commit secrets)

---

## 13. Related Documents

- Incident Response Plan
- Data Retention Policy
- Acceptable Use Policy
- BYOD Policy (if applicable)
- Remote Work Security Policy

---

## 14. Policy Review

This policy will be reviewed:
- Annually (scheduled)
- After major security incidents
- Upon regulatory changes
- When significant architecture changes occur

---

## 15. Acknowledgment

All users must acknowledge understanding of this policy:

```
I, [Name], acknowledge that I have read and understood the ZivonPay Access Control Policy.
I agree to comply with all requirements and understand that violations may result in
disciplinary action up to and including termination of employment.

Signature: ___________________
Date: ___________________
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | Security Team | Initial release |

---

**Confidential - Internal Use Only**
