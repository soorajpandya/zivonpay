# ZivonPay Data Retention Policy

**Document Version**: 1.0  
**Effective Date**: 2024  
**Review Cycle**: Annual

---

## 1. Purpose

This Data Retention Policy establishes standards for the retention and disposal of data collected, processed, and stored by ZivonPay to ensure compliance with legal requirements, support business operations, and protect customer privacy.

---

## 2. Scope

This policy applies to all data types including:
- Merchant account information
- Transaction data (orders, payments)
- Customer information (names, mobile, VPA)
- Audit and security logs
- System backups
- Business records and communications

---

## 3. Legal and Regulatory Requirements

### 3.1 Applicable Regulations

**India**:
- **IT Act 2000**: Data retention for cybercrime investigation
- **RBI Guidelines**: Payment Aggregator data retention requirements (minimum 3 years)
- **Companies Act 2013**: Financial records retention (8 years)
- **Income Tax Act 1961**: Transaction records (7 years)

**Payment Industry**:
- **PCI-DSS**: Audit trail retention (minimum 1 year, immediately available for 3 months)
- **NPCI UPI Guidelines**: Transaction logs (minimum 180 days)

**General**:
- **Business records**: 7 years (tax purposes)
- **Legal holds**: Indefinite (when litigation/investigation active)

---

## 4. Data Classification and Retention Periods

### 4.1 Transaction Data

| Data Type | Retention Period | Rationale | Disposal Method |
|-----------|-----------------|-----------|-----------------|
| **Orders** | 7 years active, then archive | Tax compliance, dispute resolution | Secure deletion after archive period |
| **Payments** | 7 years active, then archive | Financial audit, chargebacks | Secure deletion after archive period |
| **Refunds** | 7 years active, then archive | Accounting requirements | Secure deletion after archive period |
| **Webhooks** | 1 year | Debugging, redelivery | Automated purge |
| **Idempotency Keys** | 30 days | Duplicate request prevention | Automated purge |
| **Failed Transactions** | 90 days | Analysis, debugging | Automated purge |

**Storage Location**: PostgreSQL RDS (active), S3 Glacier (archive)

### 4.2 Customer Information

| Data Type | Retention Period | Rationale | Disposal Method |
|-----------|-----------------|-----------|-----------------|
| **Customer Name** (encrypted) | 7 years after last transaction | Transaction history, disputes | Secure deletion with encryption key rotation |
| **Customer Mobile** (encrypted) | 7 years after last transaction | KYC, fraud prevention | Secure deletion with encryption key rotation |
| **Customer Email** (encrypted) | 7 years after last transaction | Communication, notifications | Secure deletion with encryption key rotation |
| **Payer VPA** (encrypted) | 7 years after last transaction | Payment verification | Secure deletion with encryption key rotation |

**Note**: All PII encrypted with AES-256 in database

### 4.3 Merchant Data

| Data Type | Retention Period | Rationale | Disposal Method |
|-----------|-----------------|-----------|-----------------|
| **Merchant Profile** | 7 years after account closure | Regulatory compliance | Secure deletion |
| **API Keys** | Until merchant active + 1 year | Access management | Hash cleared, logs retained |
| **KYC Documents** | 10 years after account closure | RBI PA requirements | Secure deletion from encrypted storage |
| **Business Details** | 7 years after account closure | Tax records | Secure deletion |

### 4.4 Audit and Security Logs

| Data Type | Retention Period | Rationale | Disposal Method |
|-----------|-----------------|-----------|-----------------|
| **Audit Logs** (database) | 7 years | Compliance audits, investigations | Archive to S3, then delete |
| **Application Logs** (CloudWatch) | 30 days online, 365 days archive | Debugging, security analysis | Automatic CloudWatch deletion |
| **VPC Flow Logs** | 90 days | Network security analysis | Automatic deletion |
| **CloudTrail Logs** | 10 years | Infrastructure audit trail | S3 lifecycle to Glacier |
| **WAF Logs** | 90 days | Attack pattern analysis | Automatic deletion |
| **Access Logs** (ALB) | 180 days | Performance, security | S3 lifecycle policy |
| **Rate Limit Records** | 7 days | Rate limiting enforcement | Redis TTL expiry |

### 4.5 System Backups

| Backup Type | Retention Period | Rationale | Disposal Method |
|-------------|-----------------|-----------|-----------------|
| **RDS Automated Backups** | 30 days (production), 7 days (sandbox) | Disaster recovery | AWS automatic deletion |
| **RDS Manual Snapshots** | 90 days | Major release backup | Manual deletion after verification |
| **Redis Snapshots** | 5 days (production), 1 day (sandbox) | Cache recovery | AWS automatic deletion |
| **Code Repository** | Indefinite | Version history | N/A - Git history maintained |
| **Terraform State** | Indefinite | Infrastructure history | S3 versioning, manual cleanup of very old |

### 4.6 Business Records

| Data Type | Retention Period | Rationale | Disposal Method |
|-----------|-----------------|-----------|-----------------|
| **Contracts** | 7 years after expiry | Legal disputes | Secure archival, then shredding |
| **Financial Statements** | 8 years | Companies Act | Secure archival |
| **Tax Returns** | 7 years | Income Tax Act | Secure archival |
| **Compliance Reports** | 10 years | Regulatory audits | Secure archival |
| **Incident Reports** | 10 years | Legal evidence, lessons learned | Secure archival |
| **Employee Records** | 3 years after termination | HR compliance | Secure archival, then shredding |

---

## 5. Data Lifecycle Management

### 5.1 Data Creation and Collection

**Principles**:
- Collect only necessary data (data minimization)
- Document purpose for each data element
- Obtain consent where required (merchant onboarding)

**Implementation**:
```python
# Example: Order creation with minimal data
order = Order(
    merchant_id=merchant.id,
    amount=1000,
    customer_name=encrypt(customer['name']),  # Encrypted
    customer_mobile=encrypt(customer['mobile']),  # Encrypted
    # No unnecessary fields collected
)
```

### 5.2 Active Storage

**Production Database**:
- All tables with `created_at`, `updated_at` timestamps
- Regular index maintenance for query performance
- Encryption at rest enabled
- Multi-AZ for high availability

**Caching Layer**:
- Redis with TTL for rate limiting (7 days)
- Session cache (24 hours)
- No PII stored in cache

### 5.3 Archival Process

**Automated Archival** (quarterly job):

```sql
-- Archive orders older than 3 years to S3
SELECT * FROM orders 
WHERE created_at < NOW() - INTERVAL '3 years'
AND archived = false;

-- Export to S3 Glacier
-- Mark as archived in database
UPDATE orders SET archived = true, archived_at = NOW()
WHERE id IN (archived_ids);
```

**Archive Storage**:
- S3 Standard: 0-90 days
- S3 Standard-IA: 90 days - 1 year
- S3 Glacier: 1-7 years
- Glacier Deep Archive: 7+ years

**Metadata Retention**:
- Even after archival, metadata remains in database:
  - Order ID, merchant ID, amount, status, created_at
  - No PII retained after archival
  - Reference to S3 archive location

### 5.4 Data Deletion

**Automated Deletion Jobs**:

```python
# Daily job - Delete expired idempotency keys
DELETE FROM idempotency_keys 
WHERE created_at < NOW() - INTERVAL '30 days';

# Daily job - Delete old webhooks
DELETE FROM webhooks 
WHERE created_at < NOW() - INTERVAL '1 year';

# Weekly job - Delete old rate_limits
DELETE FROM rate_limits 
WHERE created_at < NOW() - INTERVAL '7 days';
```

**Manual Deletion** (merchant request):
1. Merchant submits deletion request via support
2. Legal reviews for active disputes/investigations
3. If approved, data deletion job scheduled
4. Deletion confirmation sent to merchant
5. Deletion logged in audit trail

**Secure Deletion Process**:
- Database: `DELETE` followed by `VACUUM FULL`
- Encrypted fields: Encryption key rotation (makes data unrecoverable)
- S3: Delete with versioning disabled, or delete all versions
- Backups: Wait for backup retention period to expire naturally

---

## 6. Legal Holds and Litigation

### 6.1 Legal Hold Process

When litigation, investigation, or audit is anticipated:

1. **Legal team issues hold notice**:
   - Specific data scope (merchant IDs, date ranges)
   - Reason for hold (case number, investigation)
   - Estimated duration

2. **Technical implementation**:
   ```sql
   -- Mark data under legal hold
   UPDATE orders SET legal_hold = true 
   WHERE merchant_id = 'target_merchant_id'
   AND created_at BETWEEN 'start_date' AND 'end_date';
   ```

3. **Automated deletion suspended**:
   - Data with `legal_hold=true` excluded from deletion jobs
   - Backups preserved until hold is lifted

4. **Hold release**:
   - Legal team confirms case closed
   - Legal hold flag removed
   - Normal retention schedule resumes

### 6.2 Data Subject Requests

**Right to Access** (merchant/customer request):
- Provide all data held about the requester within 30 days
- Exportformat: JSON or PDF report
- No fee for first request per year

**Right to Deletion** (Right to be Forgotten):
- Delete personal data unless legal/regulatory obligation
- Cannot delete transaction data within 7-year retention period
- Can anonymize PII while retaining transaction metadata

**Right to Rectification**:
- Correct inaccurate personal data
- Update via merchant API or support ticket
- All changes logged in audit trail

---

## 7. Data Retention Schedule Summary

| Category | Active Retention | Archive Period | Total Retention | Disposal |
|----------|-----------------|----------------|-----------------|----------|
| **Transaction Data** | 3 years | 4 years | 7 years | Secure delete |
| **Customer PII** | With transactions | With transactions | 7 years post last transaction | Key rotation |
| **Merchant Data** | Account active + 1 year | 6 years | 7 years post closure | Secure delete |
| **Audit Logs** | 30 days (online) | 6 years 11 months | 7 years | Archive purge |
| **Application Logs** | 30 days | 11 months | 1 year | Auto-delete |
| **Database Backups** | 30 days (production) | - | 30 days | AWS auto-delete |
| **Financial Records** | 7 years | - | 7-8 years | Secure archive |
| **Compliance Reports** | 3 years | 7 years | 10 years | Secure archive |

---

## 8. Roles and Responsibilities

| Role | Responsibility |
|------|---------------|
| **Data Protection Officer** | Overall policy compliance, legal hold management |
| **Database Administrator** | Execute retention/deletion jobs, backup management |
| **DevOps Engineer** | Configure CloudWatch/S3 lifecycle policies |
| **Legal Team** | Interpret legal requirements, issue legal holds |
| **Support Team** | Process merchant data requests |
| **Compliance Team** | Audit retention compliance, annual policy review |

---

## 9. Monitoring and Compliance

### 9.1 Retention Compliance Checks

**Monthly Review**:
- Verify automated deletion jobs executed successfully
- Check S3 lifecycle policies active
- Review legal hold list for expired holds

**Quarterly Audit**:
- Sample data to verify retention periods enforced
- Review archive storage costs and optimize
- Update retention schedule if regulations change

**Annual Certification**:
- All departments certify compliance with retention policy
- Update policy based on regulatory changes
- Board-level attestation for compliance

### 9.2 Metrics and Reporting

**Key Metrics**:
- Total data volume by category
- Archive storage costs
- Deletion job execution success rate
- Legal hold duration (average)
- Data subject request fulfillment time

**Dashboard**:
- Real-time view of data storage across lifecycle stages
- Alerts for retention policy violations
- Compliance status indicators

---

## 10. Exceptions

Policy exceptions require:
1. Business justification or legal requirement
2. Data Protection Officer approval
3. Documented compensating controls
4. Review every 6 months

**Example Exception**:
- Retain specific merchant data beyond 7 years for ongoing litigation
- Documented in legal hold system
- Reviewed quarterly until litigation resolved

---

## 11. Training and Awareness

All employees with data access receive training on:
- Data lifecycle stages
- Retention requirements for their role
- Secure disposal procedures
- Consequences of retention policy violations

Training conducted:
- During onboarding
- Annually thereafter
- When policy changes significantly

---

## 12. Policy Review and Updates

This policy will be reviewed:
- **Annually** (scheduled review)
- **Regulatory changes** (RBI, PCI-DSS updates)
- **After audits** (if gaps identified)
- **Major incidents** (data breach, privacy violation)

Review process:
1. Legal and Compliance teams assess regulatory changes
2. Technical team evaluates implementation feasibility
3. Draft updates circulated for feedback
4. Executive approval
5. All staff notified of changes
6. Training updated

---

## 13. Contact Information

**Questions about this policy**:
- Email: dpo@zivonpay.com (Data Protection Officer)
- Email: legal@zivonpay.com (Legal team)

**Data subject requests**:
- Email: privacy@zivonpay.com
- Response SLA: 30 days

**Legal hold requests**:
- Email: legal@zivonpay.com
- Phone: [Contact number]

---

## 14. Related Documents

- Access Control Policy
- Information Security Policy
- Incident Response Plan
- Business Continuity Plan
- Privacy Policy (public-facing)
- Merchant Terms of Service

---

## 15. Version History

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | 2024 | Initial release | [DPO Name, CTO Name] |

---

## 16. Acknowledgment

Data custodians must acknowledge understanding of retention requirements:

```
I, [Name], acknowledge that I understand the data retention requirements applicable to
my role and will comply with all retention and disposal procedures.

Signature: ___________________
Date: ___________________
Role: ___________________
```

---

**Confidential - Internal Use Only**
