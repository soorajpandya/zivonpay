"""
Payment Model - Stores payment transaction information
"""

from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class PaymentStatus(str, enum.Enum):
    """Payment status enum"""
    CREATED = "created"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"


class Payment(Base):
    """Payment transaction model"""
    
    __tablename__ = "payments"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Payment Details
    amount = Column(Integer, nullable=False)  # Amount in paise
    currency = Column(String(3), nullable=False, default="INR")
    status = Column(
        Enum(PaymentStatus, name="payment_status_type", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=PaymentStatus.CREATED,
        index=True
    )
    
    # UPI Transaction Details (Encrypted)
    payer_vpa = Column(String)  # Encrypted VPA
    rrn = Column(String(50), index=True)  # Retrieval Reference Number
    transaction_id = Column(String(100))  # Bank transaction ID
    
    # Bank Details
    bank_reference = Column(String(100))
    bank_name = Column(String(100))
    
    # Failure Information
    error_code = Column(String(50))
    error_description = Column(String)
    
    # Additional Data
    extra_data = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    captured_at = Column(DateTime)
    failed_at = Column(DateTime)
    
    # Relationships
    order = relationship("Order", back_populates="payments")
    merchant = relationship("Merchant", back_populates="payments")
    
    def __repr__(self):
        return f"<Payment {self.id} - {self.status}>"
