"""
API Key Model - For multiple keys per merchant
"""

from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base
from app.models.merchant import EnvironmentType


class APIKey(Base):
    """API Key model for merchant authentication"""
    
    __tablename__ = "api_keys"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Key
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Key Details
    key_id = Column(String(100), unique=True, nullable=False, index=True)
    key_secret_hash = Column(String(255), nullable=False)
    key_name = Column(String(100))
    
    # Permissions
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    environment = Column(
        Enum(EnvironmentType, name="environment_type", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=EnvironmentType.SANDBOX
    )
    
    # Metadata
    last_used_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    # Relationships
    merchant = relationship("Merchant", back_populates="api_keys")
    
    def __repr__(self):
        return f"<APIKey {self.key_id}>"
