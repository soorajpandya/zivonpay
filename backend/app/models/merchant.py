"""
Merchant Model - Stores merchant account information
"""

from sqlalchemy import Column, String, Boolean, DateTime, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class EnvironmentType(str, enum.Enum):
    """Environment type enum"""
    SANDBOX = "sandbox"
    PRODUCTION = "production"


class Merchant(Base):
    """Merchant account model"""
    
    __tablename__ = "merchants"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Business Information
    business_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    mobile = Column(String(15))
    
    # API Credentials (Sandbox)
    api_key_id = Column(String(100), unique=True, nullable=False, index=True)
    api_secret_hash = Column(String(255), nullable=False)
    
    # API Credentials (Live/Production)
    live_api_key_id = Column(String(100), unique=True, nullable=True, index=True)
    live_api_secret_hash = Column(String(255), nullable=True)
    
    webhook_url = Column(String)
    webhook_secret_hash = Column(String(255))
    
    # Environment
    environment = Column(
        Enum(EnvironmentType, name="environment_type", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=EnvironmentType.SANDBOX,
        index=True
    )
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    
    # Additional Data
    extra_data = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_active_at = Column(DateTime)
    
    # Relationships
    orders = relationship("Order", back_populates="merchant", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="merchant", cascade="all, delete-orphan")
    webhooks = relationship("Webhook", back_populates="merchant", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="merchant", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Merchant {self.business_name} ({self.environment})>"
