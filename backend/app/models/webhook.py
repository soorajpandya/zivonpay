"""
Webhook Model - Stores webhook delivery attempts
"""

from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class WebhookEventType(str, enum.Enum):
    """Webhook event type enum"""
    PAYMENT_CAPTURED = "payment.captured"
    PAYMENT_FAILED = "payment.failed"
    ORDER_PAID = "order.paid"
    PAYMENT_REFUNDED = "payment.refunded"


class WebhookStatus(str, enum.Enum):
    """Webhook delivery status enum"""
    PENDING = "pending"
    DELIVERED = "delivered"
    FAILED = "failed"


class Webhook(Base):
    """Webhook delivery model"""
    
    __tablename__ = "webhooks"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Key
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Event Details
    event_type = Column(
        Enum(WebhookEventType, name="webhook_event_type", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    entity_id = Column(UUID(as_uuid=True), nullable=False)  # ID of order or payment
    
    # Delivery Details
    url = Column(String, nullable=False)
    status = Column(
        Enum(WebhookStatus, name="webhook_status_type", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=WebhookStatus.PENDING,
        index=True
    )
    attempt_count = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=3)
    
    # Request/Response
    payload = Column(JSON, nullable=False)
    response_status_code = Column(Integer)
    response_body = Column(String)
    
    # Signature
    signature = Column(String(255))
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    next_retry_at = Column(DateTime, index=True)
    delivered_at = Column(DateTime)
    failed_at = Column(DateTime)
    
    # Relationships
    merchant = relationship("Merchant", back_populates="webhooks")
    
    def __repr__(self):
        return f"<Webhook {self.event_type} - {self.status}>"
