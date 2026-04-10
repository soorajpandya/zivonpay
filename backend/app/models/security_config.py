"""
Security Configuration Model — Per-merchant whitelist & security settings
"""

from sqlalchemy import Column, String, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY, INET
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class MerchantSecurityConfig(Base):
    """Per-merchant security configuration — whitelisted domains, IPs, signing settings"""

    __tablename__ = "merchant_security_configs"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Key
    merchant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("merchants.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # Whitelisted domains (Origin / Referer validation)
    whitelisted_domains = Column(JSON, default=list)  # ["example.com", "*.example.com"]

    # Whitelisted IPs
    whitelisted_ips = Column(JSON, default=list)  # ["1.2.3.4", "10.0.0.0/24"]

    # Feature toggles
    enforce_domain_check = Column(Boolean, default=False)
    enforce_ip_check = Column(Boolean, default=False)
    enforce_request_signing = Column(Boolean, default=False)
    enforce_replay_protection = Column(Boolean, default=True)

    # Signing secret (separate from API secret — used for HMAC request signing)
    signing_secret_hash = Column(String(255), nullable=True)

    # Rate limit overrides (null = use global defaults)
    rate_limit_per_minute = Column(String(20), nullable=True)  # e.g., "500"

    # Device fingerprint binding
    enforce_device_binding = Column(Boolean, default=False)
    known_device_fingerprints = Column(JSON, default=list)

    # mTLS certificate subject (DN) — for bank-grade integrations
    mtls_certificate_subject = Column(String(500), nullable=True)
    enforce_mtls = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<MerchantSecurityConfig merchant_id={self.merchant_id}>"
