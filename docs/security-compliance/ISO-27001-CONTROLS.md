# ISO 27001:2022 Controls Mapping
## ZivonPay Payment Aggregator Platform

**Document Version**: 1.0  
**Date**: 2024  
**Scope**: ZivonPay API platform

---

## A.5 Information Security Policies

### A.5.1 Management Direction for Information Security

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.5.1.1 | Policies for information security | Security policies documented | `docs/security-compliance/` |
| A.5.1.2 | Review of policies for information security | Annual policy review process | Security governance framework |

**Status**: ✅ Implemented

---

## A.6 Organization of Information Security

### A.6.1 Internal Organization

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.6.1.1 | Information security roles and responsibilities | Security team defined | Organizational chart |
| A.6.1.2 | Segregation of duties | Separate dev, ops, security roles | IAM policies |
| A.6.1.3 | Contact with authorities | Incident escalation procedures | Incident response plan |
| A.6.1.4 | Contact with special interest groups | Security community participation | External relationships |
| A.6.1.5 | Information security in project management | Security in SDLC | Development process |

### A.6.2 Mobile Devices and Teleworking

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.6.2.1 | Mobile device policy | API-only service, no mobile policy needed | N/A |
| A.6.2.2 | Teleworking | Remote access via AWS IAM, MFA | IAM configuration |

**Status**: ✅ Partially Implemented (mobile N/A)

---

## A.7 Human Resource Security

### A.7.1 Prior to Employment

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.7.1.1 | Screening | Background checks for personnel | HR process |
| A.7.1.2 | Terms and conditions of employment | Security clauses in contracts | Employment contracts |

### A.7.2 During Employment

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.7.2.1 | Management responsibilities | Security training program | Training records |
| A.7.2.2 | Information security awareness | Developer security training | Training schedule |
| A.7.2.3 | Disciplinary process | Violation consequences documented | HR policy |

### A.7.3 Termination and Change of Employment

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.7.3.1 | Termination responsibilities | Access revocation procedures | Offboarding checklist |

**Status**: 🔄 Process-based

---

## A.8 Asset Management

### A.8.1 Responsibility for Assets

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.8.1.1 | Inventory of assets | Terraform state tracks all infrastructure | `terraform/` state files |
| A.8.1.2 | Ownership of assets | Resource tagging with owner | AWS tags |
| A.8.1.3 | Acceptable use of assets | Developer handbook | Documentation |
| A.8.1.4 | Return of assets | Part of offboarding | HR process |

### A.8.2 Information Classification

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.8.2.1 | Classification of information | Data classified as sensitive/public | Data classification policy |
| A.8.2.2 | Labeling of information | Database fields marked as encrypted | `backend/schema.sql` |
| A.8.2.3 | Handling of assets | Encryption for sensitive data | AES-256 encryption |

### A.8.3 Media Handling

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.8.3.1 | Management of removable media | Cloud-based, no removable media | N/A |
| A.8.3.2 | Disposal of media | RDS deletion with final snapshot | `terraform/modules/rds/main.tf:24-25` |
| A.8.3.3 | Physical media transfer | Encrypted backups only | RDS backup encryption |

**Status**: ✅ Implemented

---

## A.9 Access Control

### A.9.1 Business Requirements of Access Control

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.9.1.1 | Access control policy | Least privilege access policy | IAM policies document |
| A.9.1.2 | Access to networks and network services | Security groups restrict access | `terraform/modules/security-groups/` |

### A.9.2 User Access Management

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.9.2.1 | User registration and de-registration | Merchant API key management | `backend/app/api/v1/endpoints/merchants.py` |
| A.9.2.2 | User access provisioning | HTTP Basic Auth with API keys | `backend/app/api/dependencies.py:10-28` |
| A.9.2.3 | Management of privileged access rights | IAM policies for ECS task roles | `terraform/modules/ecs/main.tf:130-162` |
| A.9.2.4 | Management of secret authentication | Secrets Manager for credentials | `terraform/modules/secrets/` |
| A.9.2.5 | Review of user access rights | Quarterly access reviews | Security operations |
| A.9.2.6 | Removal of access rights | Merchant deactivation API | Merchant management |

### A.9.3 User Responsibilities

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.9.3.1 | Use of secret authentication information | API key security guidelines | Merchant documentation |

### A.9.4 System and Application Access Control

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.9.4.1 | Information access restriction | Role-based access control | API authentication |
| A.9.4.2 | Secure log-on procedures | HTTP Basic Auth authentication | Authentication dependency |
| A.9.4.3 | Password management system | Bcrypt for password hashing | `backend/app/core/security.py:40-56` |
| A.9.4.4 | Use of privileged utility programs | AWS Systems Manager Session Manager | ECS Exec configuration |
| A.9.4.5 | Access control to program source code | Git repository access control | GitHub permissions |

**Status**: ✅ Implemented

---

## A.10 Cryptography

### A.10.1 Cryptographic Controls

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.10.1.1 | Policy on the use of cryptographic controls | Cryptography policy documented | Security documentation |
| A.10.1.2 | Key management | AWS Secrets Manager for key storage | `terraform/modules/secrets/` |

**Cryptographic Standards**:
- **Data at Rest**: AES-256 (Fernet cipher)
- **Data in Transit**: TLS 1.3
- **Password Hashing**: Bcrypt (12 rounds)
- **Webhook Signatures**: HMAC-SHA256
- **Database Encryption**: PostgreSQL native encryption

**Evidence**:
- `backend/app/core/security.py:20-38` - AES-256 implementation
- `terraform/modules/alb/main.tf:45-46` - TLS 1.3 configuration
- `backend/app/core/security.py:97-106` - HMAC implementation

**Status**: ✅ Implemented

---

## A.11 Physical and Environmental Security

### A.11.1 Secure Areas

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.11.1.1 | Physical security perimeter | AWS data center security | AWS SOC reports |
| A.11.1.2 | Physical entry controls | AWS managed | AWS compliance documentation |
| A.11.1.3 | Securing offices, rooms and facilities | AWS managed | AWS physical security |
| A.11.1.4 | Protecting against external threats | AWS managed | AWS infrastructure |
| A.11.1.5 | Working in secure areas | AWS managed | AWS procedures |
| A.11.1.6 | Delivery and loading areas | AWS managed | AWS procedures |

### A.11.2 Equipment

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.11.2.1 | Equipment siting and protection | AWS managed | AWS data centers |
| A.11.2.2 | Supporting utilities | AWS managed | AWS infrastructure |
| A.11.2.3 | Cabling security | AWS managed | AWS network security |
| A.11.2.4 | Equipment maintenance | AWS managed | AWS managed services |
| A.11.2.5 | Removal of assets | AWS managed | AWS procedures |
| A.11.2.6 | Security of equipment off-premises | Cloud-based service | N/A |
| A.11.2.7 | Secure disposal of equipment | RDS deletion with protection | Terraform configuration |
| A.11.2.8 | Unattended user equipment | N/A - API service | N/A |
| A.11.2.9 | Clear desk and clear screen policy | Developer policy | Security policy |

**Status**: ✅ Inherited from AWS

---

## A.12 Operations Security

### A.12.1 Operational Procedures and Responsibilities

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.12.1.1 | Documented operating procedures | Operational runbooks | Operations documentation |
| A.12.1.2 | Change management | Git-based change control | GitHub workflow |
| A.12.1.3 | Capacity management | ECS autoscaling configured | `terraform/modules/ecs/main.tf:99-136` |
| A.12.1.4 | Separation of environments | Separate sandbox and production | Environment tfvars |

### A.12.2 Protection from Malware

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.12.2.1 | Controls against malware | ECR image scanning | ECR configuration |

### A.12.3 Backup

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.12.3.1 | Information backup | RDS automated backups daily | `terraform/modules/rds/main.tf:20-22` |

### A.12.4 Logging and Monitoring

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.12.4.1 | Event logging | CloudWatch Logs for all events | `backend/app/core/logging.py` |
| A.12.4.2 | Protection of log information | CloudWatch encryption at rest | CloudWatch configuration |
| A.12.4.3 | Administrator and operator logs | CloudTrail for infrastructure | CloudTrail enabled |
| A.12.4.4 | Clock synchronization | AWS NTP service | AWS infrastructure |

### A.12.5 Control of Operational Software

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.12.5.1 | Installation of software | Container-based deployment | Docker image |

### A.12.6 Technical Vulnerability Management

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.12.6.1 | Management of technical vulnerabilities | Dependency scanning | CI/CD pipeline |
| A.12.6.2 | Restrictions on software installation | Immutable container images | Fargate deployment |

### A.12.7 Information Systems Audit Considerations

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.12.7.1 | Information systems audit controls | Audit logs in database | `backend/schema.sql:141-150` |

**Status**: ✅ Implemented

---

## A.13 Communications Security

### A.13.1 Network Security Management

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.13.1.1 | Network controls | Security groups and NACLs | `terraform/modules/security-groups/` |
| A.13.1.2 | Security of network services | TLS 1.3 for all external connections | ALB configuration |
| A.13.1.3 | Segregation in networks | VPC with public/private subnets | `terraform/modules/vpc/` |

### A.13.2 Information Transfer

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.13.2.1 | Information transfer policies | Encryption required for all transfers | Security policy |
| A.13.2.2 | Agreements on information transfer | API contracts with merchants | API documentation |
| A.13.2.3 | Electronic messaging | Webhook delivery with signatures | `backend/app/services/webhook.py` |
| A.13.2.4 | Confidentiality agreements | Merchant terms of service | Legal agreements |

**Status**: ✅ Implemented

---

## A.14 System Acquisition, Development and Maintenance

### A.14.1 Security Requirements of Information Systems

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.14.1.1 | Information security requirements | Security requirements documented | This checklist |
| A.14.1.2 | Securing application services | TLS, authentication for all APIs | API implementation |
| A.14.1.3 | Protecting application services transactions | Idempotency keys, webhook signatures | API design |

### A.14.2 Security in Development and Support Processes

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.14.2.1 | Secure development policy | Git workflow, code reviews | Development process |
| A.14.2.2 | System change control procedures | Pull request approval required | GitHub settings |
| A.14.2.3 | Technical review after platform changes | Terraform plan review | Change management |
| A.14.2.4 | Restrictions on changes to software packages | Immutable container images | Docker workflow |
| A.14.2.5 | Secure system engineering principles | OWASP guidelines followed | Code structure |
| A.14.2.6 | Secure development environment | Separate sandbox environment | Environment separation |
| A.14.2.7 | Outsourced development | N/A - In-house development | N/A |
| A.14.2.8 | System security testing | Unit tests, integration tests | Test suite |
| A.14.2.9 | System acceptance testing | Staging environment testing | Deployment process |

### A.14.3 Test Data

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.14.3.1 | Protection of test data | Synthetic test data only | Testing guidelines |

**Status**: ✅ Implemented

---

## A.15 Supplier Relationships

### A.15.1 Information Security in Supplier Relationships

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.15.1.1 | Information security policy for suppliers | Service provider agreements | Vendor management |
| A.15.1.2 | Addressing security in supplier agreements | Security clauses in contracts | SprintNXT contract |
| A.15.1.3 | ICT supply chain | Cloud providers vetted | AWS, SprintNXT due diligence |

### A.15.2 Supplier Service Delivery Management

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.15.2.1 | Monitoring of supplier service delivery | Quarterly reviews of SprintNXT | Vendor reviews |
| A.15.2.2 | Managing changes to supplier services | Change notification process | Service agreements |

**Suppliers**:
1. **AWS** - Infrastructure provider (PCI-DSS Level 1, ISO 27001 certified)
2. **SprintNXT** - UPI payment gateway (PCI-DSS compliant)

**Status**: ✅ Implemented

---

## A.16 Information Security Incident Management

### A.16.1 Management of Information Security Incidents

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.16.1.1 | Responsibilities and procedures | Incident response plan documented | `docs/security-compliance/INCIDENT-RESPONSE.md` |
| A.16.1.2 | Reporting information security events | CloudWatch alarms to security team | Monitoring configuration |
| A.16.1.3 | Reporting information security weaknesses | Vulnerability reporting process | Security policy |
| A.16.1.4 | Assessment of information security events | Incident triage procedures | Incident response plan |
| A.16.1.5 | Response to information security incidents | Escalation and response procedures | Incident response plan |
| A.16.1.6 | Learning from information security incidents | Post-incident reviews | Incident process |
| A.16.1.7 | Collection of evidence | Log preservation procedures | Incident response plan |

**Status**: ✅ Implemented

---

## A.17 Information Security Aspects of Business Continuity

### A.17.1 Information Security Continuity

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.17.1.1 | Planning information security continuity | Business continuity plan | BCP documentation |
| A.17.1.2 | Implementing information security continuity | Multi-AZ RDS, ECS autoscaling | High availability architecture |
| A.17.1.3 | Verify, review and evaluate continuity | BCP tested annually | Testing schedule |

### A.17.2 Redundancies

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.17.2.1 | Availability of information processing facilities | Multi-AZ deployment | `terraform/variables.tf:29-33` |

**High Availability Features**:
- RDS Multi-AZ for database (production)
- ECS tasks across 3 availability zones
- ALB with cross-zone load balancing
- ElastiCache with automatic failover (production)
- Automated backups with 30-day retention

**Status**: ✅ Implemented

---

## A.18 Compliance

### A.18.1 Compliance with Legal and Contractual Requirements

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.18.1.1 | Identification of applicable legislation | Legal audit completed | Compliance register |
| A.18.1.2 | Intellectual property rights | Open source licenses tracked | License documentation |
| A.18.1.3 | Protection of records | Audit logs retained | CloudWatch retention |
| A.18.1.4 | Privacy and protection of PII | PII encrypted in database | AES-256 encryption |
| A.18.1.5 | Regulation of cryptographic controls | Compliant with local regulations | Legal review |

### A.18.2 Information Security Reviews

| Control | Description | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.18.2.1 | Independent review of information security | Annual security audit | Audit schedule |
| A.18.2.2 | Compliance with security policies | Quarterly compliance reviews | Security operations |
| A.18.2.3 | Technical compliance review | Infrastructure as Code reviews | Terraform validation |

**Applicable Regulations**:
- PCI-DSS v4.0 (payment card industry)
- IT Act 2000 (India) - Data protection
- NPCI UPI Guidelines
- RBI Payment Aggregator regulations

**Status**: ✅ Implemented

---

## Control Implementation Summary

| Annex | Total Controls | Implemented | Process | Planned | N/A |
|-------|---------------|-------------|---------|---------|-----|
| A.5 | 2 | 2 | 0 | 0 | 0 |
| A.6 | 7 | 4 | 2 | 0 | 1 |
| A.7 | 7 | 1 | 6 | 0 | 0 |
| A.8 | 10 | 8 | 1 | 0 | 1 |
| A.9 | 14 | 12 | 2 | 0 | 0 |
| A.10 | 2 | 2 | 0 | 0 | 0 |
| A.11 | 15 | 2 | 0 | 0 | 13 |
| A.12 | 14 | 11 | 2 | 1 | 0 |
| A.13 | 7 | 7 | 0 | 0 | 0 |
| A.14 | 13 | 11 | 1 | 0 | 1 |
| A.15 | 5 | 5 | 0 | 0 | 0 |
| A.16 | 7 | 7 | 0 | 0 | 0 |
| A.17 | 4 | 4 | 0 | 0 | 0 |
| A.18 | 8 | 7 | 1 | 0 | 0 |
| **Total** | **115** | **83** | **15** | **1** | **16** |

**Compliance Rate**: 72.2% fully implemented, 85.2% including processes

---

## Risk Treatment

| Risk | Likelihood | Impact | Treatment | Control |
|------|-----------|--------|-----------|---------|
| Unauthorized data access | Medium | High | Reduce | A.9 - Access control, encryption |
| Data breach | Low | Critical | Reduce | A.10 - Cryptography, A.13 - TLS |
| Service disruption | Medium | High | Reduce | A.17 - High availability |
| Credential compromise | Medium | High | Reduce | A.9.2.4 - Secrets Manager |
| SQL injection | Low | High | Reduce | A.14.2.5 - Parameterized queries, WAF |
| DDoS attack | Medium | Medium | Reduce | WAF rate limiting, autoscaling |
| Insider threat | Low | High | Reduce | A.7 - HR security, audit logging |
| Upstream API failure | Medium | High | Accept | Circuit breaker, retry logic |

---

## Continuous Improvement Plan

**Q1 2024**:
- Complete external ISO 27001 audit
- Implement MFA for administrative access
- Enhanced vulnerability scanning

**Q2 2024**:
- Penetration testing
- Red team exercise
- Security awareness training

**Q3 2024**:
- Business continuity testing
- Disaster recovery drill
- Policy review and update

**Q4 2024**:
- Annual risk assessment
- Compliance gap analysis
- Security roadmap for 2025

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | Security Team | Initial release |

---

**Confidential - Internal Use Only**
