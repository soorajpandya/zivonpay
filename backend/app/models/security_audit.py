"""
Security Audit Log — Tamper-resistant, hash-chained security event log
"""

from sqlalchemy import Column, String, DateTime, JSON, Integer, Text
from sqlalchemy.dialects.postgresql import UUID, INET
from datetime import datetime
import uuid

from app.database import Base


class SecurityAuditLog(Base):
    """
    Immutable security audit trail.
    Each record references the hash of the previous record (hash chain)
    for tamper detection.
    """

    __tablename__ = "security_audit_logs"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Sequence for hash-chain ordering
    sequence = Column(Integer, autoincrement=True, unique=True, nullable=False)

    # Event classification
    event_type = Column(String(50), nullable=False, index=True)
    # Values: auth_success, auth_failure, ip_blocked, domain_blocked,
    #         signature_invalid, replay_detected, rate_limited,
    #         device_anomaly, mtls_failure, fingerprint_mismatch

    severity = Column(String(10), nullable=False, default="medium", index=True)
    # Values: low, medium, high, critical

    # Actor / source
    api_key_id = Column(String(100), index=True)
    merchant_id = Column(String(100), index=True)
    client_ip = Column(INET)
    origin = Column(String(500))
    user_agent = Column(String(1000))

    # Request context
    http_method = Column(String(10))
    endpoint = Column(String(500))
    request_id = Column(String(100), index=True)

    # Failure details
    failure_reason = Column(Text)
    failure_layer = Column(String(50))
    # Values: origin, ip, api_key, signature, replay, rate_limit, device, mtls

    # Device fingerprint (if collected)
    device_fingerprint = Column(String(128))

    # Extra metadata
    extra_data = Column(JSON, default=dict)

    # Hash chain — each record stores sha256(previous_record_hash + current_record_data)
    previous_hash = Column(String(64))  # SHA256 hex
    record_hash = Column(String(64), nullable=False, unique=True, index=True)

    # Timestamp
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f"<SecurityAuditLog {self.event_type} seq={self.sequence}>"
