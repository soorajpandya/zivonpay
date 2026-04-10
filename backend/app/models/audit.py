"""
Audit Log Model - Comprehensive audit trail
"""

from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, INET
from datetime import datetime
import uuid

from app.database import Base


class AuditLog(Base):
    """Audit log model for compliance and tracking"""
    
    __tablename__ = "audit_logs"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Actor Information
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="SET NULL"), index=True)
    user_id = Column(UUID(as_uuid=True))  # For future admin/staff users
    ip_address = Column(INET)
    user_agent = Column(String)
    
    # Action Details
    action = Column(String(100), nullable=False, index=True)  # e.g., 'order.create'
    entity_type = Column(String(50), index=True)  # e.g., 'order', 'payment'
    entity_id = Column(UUID(as_uuid=True), index=True)
    
    # Request Details
    request_id = Column(String(100), index=True)
    endpoint = Column(String(500))
    http_method = Column(String(10))
    
    # Data
    changes = Column(JSON)  # Before/after changes
    extra_data = Column(JSON, default={})
    
    # Timestamp
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<AuditLog {self.action} - {self.created_at}>"
