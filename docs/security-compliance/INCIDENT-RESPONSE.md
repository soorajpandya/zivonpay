# ZivonPay Incident Response Plan

**Document Version**: 1.0  
**Last Updated**: 2024  
**Review Cycle**: Annual

---

## 1. Purpose

This Incident Response Plan provides procedures for detecting, responding to, and recovering from security incidents affecting the ZivonPay Payment Aggregator platform.

---

## 2. Scope

This plan covers all security incidents including:
- Unauthorized access attempts
- Data breaches
- Service disruptions (DDoS, system failures)
- Malware infections
- Credential compromises
- Upstream provider failures
- Configuration errors leading to security exposure

---

## 3. Incident Response Team

### Core Team

| Role | Responsibilities | Contact |
|------|-----------------|---------|
| **Incident Commander** | Overall incident coordination | security@zivonpay.com |
| **Technical Lead** | Technical investigation and remediation | tech-lead@zivonpay.com |
| **Communications Lead** | Stakeholder communication | communications@zivonpay.com |
| **Legal/Compliance** | Regulatory compliance, legal issues | legal@zivonpay.com |
| **Customer Support** | Merchant communication | support@zivonpay.com |

### Extended Team

- Infrastructure Engineer (AWS resources)
- Database Administrator (RDS/data integrity)
- Application Developer (code fixes)
- External Security Consultant (advanced threats)

---

## 4. Incident Severity Levels

### Critical (P0)
- **Definition**: Major impact on operations, data breach confirmed, payment processing down
- **Response Time**: Immediate (< 15 minutes)
- **Examples**: 
  - Database breach with PII exposure
  - Complete service outage
  - Ransomware infection
  - SprintNXT API completely unavailable

### High (P1)
- **Definition**: Significant security event, potential data exposure, degraded service
- **Response Time**: < 1 hour
- **Examples**:
  - Failed authentication spike
  - Unusual database access patterns
  - WAF blocking high attack volume
  - RDS performance degradation

### Medium (P2)
- **Definition**: Security concern with limited immediate impact
- **Response Time**: < 4 hours
- **Examples**:
  - Single merchant credential compromise
  - Minor vulnerability discovered
  - Log anomalies detected

### Low (P3)
- **Definition**: Security observation requiring investigation
- **Response Time**: < 24 hours
- **Examples**:
  - Outdated dependency detected
  - Minor configuration drift
  - Single failed login attempt

---

## 5. Incident Response Process

### 5.1 Detection and Identification

**Detection Methods**:
1. **Automated Monitoring**:
   - CloudWatch alarms trigger PagerDuty alerts
   - WAF anomaly detection
   - RDS performance metrics
   - ECS task health checks
   - Log analysis for error patterns

2. **Manual Reporting**:
   - Merchant reports suspicious activity
   - Internal team observation
   - Security researcher disclosure
   - Upstream provider notification

**Initial Assessment Checklist**:
- [ ] Incident confirmed (not false positive)?
- [ ] What systems/data are affected?
- [ ] What is the severity level?
- [ ] Is the threat active or contained?
- [ ] Are customers impacted?
- [ ] Is PII/payment data exposed?

### 5.2 Containment

**Immediate Actions (Critical Incidents)**:

1. **Isolate Affected Systems**:
   ```bash
   # Stop compromised ECS service
   aws ecs update-service --cluster zivonpay-prod-cluster \
     --service zivonpay-prod-service --desired-count 0
   
   # Isolate RDS instance (production - careful!)
   aws rds modify-db-instance --db-instance-identifier zivonpay-prod-db \
     --vpc-security-group-ids sg-quarantine-xxxx
   ```

2. **Revoke Compromised Credentials**:
   ```bash
   # Rotate API key for compromised merchant
   # Via ZivonPay API or direct database update
   
   # Rotate AWS Secrets Manager secret
   aws secretsmanager rotate-secret --secret-id zivonpay-prod-secrets
   ```

3. **Enable Enhanced Monitoring**:
   ```bash
   # Increase log retention
   aws logs put-retention-policy --log-group-name /ecs/zivonpay-prod \
     --retention-in-days 90
   
   # Enable VPC Flow Logs (if not already)
   aws ec2 create-flow-logs --resource-type VPC \
     --resource-ids vpc-xxxxx --traffic-type ALL
   ```

4. **Block Malicious IPs** (if attack source identified):
   ```bash
   # Add IP block to WAF via Terraform
   # terraform/modules/waf/blocked_ips.tf
   ```

**Short-term Containment**:
- Deploy fixed container image with vulnerability patched
- Implement temporary rate limits
- Enable additional WAF rules
- Restrict access to affected API endpoints

### 5.3 Eradication

**Root Cause Analysis**:
1. Review CloudWatch Logs for attack timeline:
   ```bash
   aws logs filter-log-events --log-group-name /ecs/zivonpay-prod \
     --start-time $(date -d '2 hours ago' +%s)000 \
     --filter-pattern "[timestamp, request_id, level=ERROR]"
   ```

2. Analyze database audit logs:
   ```sql
   SELECT * FROM audit_logs 
   WHERE created_at > NOW() - INTERVAL '2 hours'
   AND (action = 'unauthorized_access' OR level = 'critical')
   ORDER BY created_at DESC;
   ```

3. Review VPC Flow Logs for network anomalies

4. Check Terraform state for unauthorized infrastructure changes

**Remediation Actions**:
- Apply security patches to vulnerable dependencies
- Fix code vulnerabilities (SQL injection, XSS, etc.)
- Update Terraform configurations to close security gaps
- Strengthen IAM policies
- Update firewall rules
- Rotate all secrets (database passwords, API keys, encryption keys)

### 5.4 Recovery

**Restore Normal Operations**:

1. **Deploy Fixes**:
   ```bash
   # Build and push new container image
   docker build -t zivonpay:fixed .
   docker tag zivonpay:fixed 123456789.dkr.ecr.ap-south-1.amazonaws.com/zivonpay:fixed
   docker push 123456789.dkr.ecr.ap-south-1.amazonaws.com/zivonpay:fixed
   
   # Update ECS service
   aws ecs update-service --cluster zivonpay-prod-cluster \
     --service zivonpay-prod-service --force-new-deployment
   ```

2. **Restore Database** (if data integrity compromised):
   ```bash
   # Restore RDS from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier zivonpay-prod-db-restored \
     --db-snapshot-identifier zivonpay-prod-snapshot-20240101
   ```

3. **Verify System Integrity**:
   - [ ] All services healthy in ECS
   - [ ] Database connectivity restored
   - [ ] Redis cache operational
   - [ ] SprintNXT API integration working
   - [ ] Webhook delivery functioning
   - [ ] Monitoring dashboards green

4. **Gradual Traffic Restoration**:
   ```bash
   # Start with 1 task
   aws ecs update-service --desired-count 1
   # Monitor for 15 minutes
   # Scale to normal capacity
   aws ecs update-service --desired-count 4
   ```

### 5.5 Post-Incident Activities

**Lessons Learned Meeting** (within 5 business days):
- What happened? (timeline)
- What worked well?
- What could be improved?
- What actions will prevent recurrence?

**Documentation**:
1. Complete incident report including:
   - Incident timeline
   - Root cause analysis
   - Data/systems affected
   - Customer impact
   - Actions taken
   - Lessons learned
   - Preventive measures

2. Update runbooks and documentation

3. Share findings (anonymized) with team

**Follow-up Actions**:
- [ ] Implement preventive controls
- [ ] Update monitoring rules
- [ ] Conduct security training
- [ ] Review and update policies
- [ ] Schedule follow-up audit

---

## 6. Communication Protocols

### Internal Communication

**Incident Declaration**:
```
Subject: [INCIDENT P0/P1/P2/P3] Brief Description

Status: ONGOING / CONTAINED / RESOLVED
Severity: P0 / P1 / P2 / P3
Start Time: YYYY-MM-DD HH:MM UTC
Incident Commander: Name
Bridge/Channel: Slack #incident-response

Summary:
- What happened
- Current status
- Customer impact
- Next steps

Updates: Every 30 min (P0), 1 hour (P1), 4 hours (P2)
```

**Slack Channels**:
- `#incident-response` - Active incident coordination
- `#security-alerts` - Automated security alerts
- `#ops-oncall` - On-call engineer notifications

### External Communication

**Customer Notification** (if merchants affected):

**Template for Service Disruption**:
```
Subject: [Action Required] ZivonPay Service Issue - [Date]

Dear Merchant,

We are writing to inform you of a [brief description] affecting the ZivonPay
platform on [date/time].

What happened:
[Brief description without technical jargon]

Impact:
[Specific impact to merchants - payment processing, API availability, etc.]

Actions we've taken:
[Remediation steps]

Actions required from you:
[Any merchant actions needed - API key rotation, verification, etc.]

Status:
[Current status and expected resolution time]

We sincerely apologize for any inconvenience. If you have questions,
please contact support@zivonpay.com

ZivonPay Security Team
```

**Regulatory Notification** (if data breach):
- Notify CERT-In within 6 hours (India)
- Notify RBI if payment data affected
- Notify affected customers within 72 hours (if PII breach)

---

## 7. Evidence Preservation

For incidents requiring forensic investigation:

1. **Preserve Logs**:
   ```bash
   # Export CloudWatch logs
   aws logs create-export-task --log-group-name /ecs/zivonpay-prod \
     --from $(date -d '24 hours ago' +%s)000 \
     --to $(date +%s)000 \
     --destination s3-bucket-for-forensics \
     --destination-prefix incident-2024-01-01/
   ```

2. **Database Snapshot**:
   ```bash
   aws rds create-db-snapshot \
     --db-instance-identifier zivonpay-prod-db \
     --db-snapshot-identifier incident-forensics-2024-01-01
   ```

3. **ECS Task Definition**:
   ```bash
   aws ecs describe-task-definition \
     --task-definition zivonpay-prod:123 > task-def-forensics.json
   ```

4. **Network Traffic Capture** (if needed):
   - Enable VPC Traffic Mirroring to analysis instance
   - Engage AWS support for advanced network analysis

5. **Chain of Custody**:
   - Document who accessed what data when
   - Store evidence in S3 bucket with versioning
   - Restrict access to forensics team only

---

## 8. Incident Response Testing

### Tabletop Exercises
- **Frequency**: Quarterly
- **Duration**: 2 hours
- **Participants**: Full incident response team
- **Scenarios**:
  - Database breach simulation
  - DDoS attack response
  - Credential compromise
  - Upstream API failure

### Technical Drills
- **Frequency**: Bi-annual
- **Activities**:
  - Database restore from backup
  - Failover to disaster recovery region
  - Container image rollback
  - Secrets rotation procedure

---

## 9. Tools and Resources

### Monitoring Dashboards
- **CloudWatch Dashboard**: https://console.aws.amazon.com/cloudwatch/home?region=ap-south-1#dashboards:name=ZivonPay-Prod
- **WAF Dashboard**: AWS WAF & Shield console
- **Application Metrics**: Prometheus/Grafana (if deployed)

### Log Analysis
- **CloudWatch Insights**: Query all application logs
- **Athena**: Query VPC Flow Logs, ALB logs
- **CloudTrail**: Infrastructure change audit

### Communication Tools
- **Slack**: #incident-response channel
- **PagerDuty**: On-call escalation
- **Email**: security@zivonpay.com distribution list

### External Contacts
- **AWS Support**: Premium support case
- **SprintNXT Support**: [contact details]
- **Security Researcher**: security@zivonpay.com
- **Legal Counsel**: [contact details]
- **PR Agency**: [contact details if major incident]

---

## 10. Regulatory Compliance

### Data Breach Notification Requirements

**India**:
- **CERT-In**: Report cyber incidents within 6 hours
- **RBI**: Notify payment-related breaches immediately
- **IT Act 2000**: Comply with data protection provisions

**PCI-DSS**:
- Notify payment brands (Visa, Mastercard) within 72 hours of card data breach
- Engage PCI forensic investigator (PFI) for compromises

**ISO 27001**:
- Document incident in ISMS records
- Review controls effectiveness post-incident

---

## 11. Appendices

### A. Incident Severity Matrix

| Factor | Critical (P0) | High (P1) | Medium (P2) | Low (P3) |
|--------|--------------|-----------|-------------|----------|
| Availability | Complete outage | Degraded (>50%) | Degraded (<50%) | No impact |
| Data Exposure | PII/payment data | Merchant metadata | Non-sensitive | None |
| Customer Impact | All merchants | >25% merchants | <25% merchants | None |
| Revenue Impact | >$10k/hour | $1k-$10k/hour | <$1k/hour | None |
| Reputational | Severe | High | Moderate | Low |

### B. Contact List

| Name | Role | Phone | Email | Backup |
|------|------|-------|-------|--------|
| [Name] | Incident Commander | +91-xxx | security@zivonpay.com | [Backup name] |
| [Name] | Technical Lead | +91-xxx | tech-lead@zivonpay.com | [Backup name] |
| [Name] | Comm Lead | +91-xxx | comms@zivonpay.com | [Backup name] |

### C. Runbook Links

- Database Restoration: `docs/runbooks/rds-restore.md`
- ECS Service Recovery: `docs/runbooks/ecs-recovery.md`
- Secrets Rotation: `docs/runbooks/secrets-rotation.md`
- WAF Rule Updates: `docs/runbooks/waf-management.md`

### D. Post-Incident Report Template

Available at: `docs/templates/post-incident-report.md`

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | Security Team | Initial release |

---

**Confidential - Internal Use Only**
