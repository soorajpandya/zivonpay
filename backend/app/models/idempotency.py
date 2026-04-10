"""
Idempotency Key Model - Ensures idempotent API requests
"""

from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.database import Base


class IdempotencyKey(Base):
    """Idempotency key model for preventing duplicate requests"""
    
    __tablename__ = "idempotency_keys"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Key
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    
    # Key Details
    idempotency_key = Column(String(255), nullable=False, index=True)
    request_path = Column(String(500), nullable=False)
    request_method = Column(String(10), nullable=False)
    
    # Request/Response Data
    request_hash = Column(String(64), nullable=False)  # SHA256 hash
    response_code = Column(Integer, nullable=False)
    response_body = Column(JSON, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False, index=True)
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('merchant_id', 'idempotency_key', name='unique_idempotency_key'),
    )
    
    def __repr__(self):
        return f"<IdempotencyKey {self.idempotency_key}>"
