"""
Order Model - Stores order information
"""

from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class OrderStatus(str, enum.Enum):
    """Order status enum"""
    CREATED = "created"
    QR_GENERATED = "qr_generated"
    PAID = "paid"
    FAILED = "failed"
    EXPIRED = "expired"
    REFUNDED = "refunded"


class Order(Base):
    """Order model"""
    
    __tablename__ = "orders"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Key
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Order Details
    receipt = Column(String(255), nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # Amount in paise
    currency = Column(String(3), nullable=False, default="INR")
    status = Column(
        Enum(OrderStatus, name="order_status_type", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=OrderStatus.CREATED,
        index=True
    )
    
    # Customer Information (Encrypted)
    customer_name = Column(String)
    customer_mobile = Column(String)
    customer_email = Column(String)
    
    # UPI Details
    upi_intent_url = Column(String)
    qr_code_url = Column(String)
    
    # SprintNXT References
    upstream_reference = Column(String(255), index=True)  # UPIRefID
    upstream_merchant_id = Column(String(255))  # merchantId
    
    # Additional Data
    notes = Column(JSON, default={})
    extra_data = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = Column(DateTime, index=True)
    expires_at = Column(DateTime)
    
    # Relationships
    merchant = relationship("Merchant", back_populates="orders")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order {self.id} - {self.status}>"
