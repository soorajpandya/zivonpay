"""
Payment Intent Model - Stores payment intent / link information
Independent of the QR-based order flow.
"""

from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class PaymentIntentStatus(str, enum.Enum):
    """Payment intent lifecycle status"""
    CREATED = "created"
    PENDING = "pending"       # Customer opened link, payment initiated
    SUCCESS = "success"       # Payment confirmed by gateway
    FAILED = "failed"         # Payment failed
    EXPIRED = "expired"       # Link expired before payment


class PaymentIntent(Base):
    """Payment Intent model — standalone payment link flow"""

    __tablename__ = "payment_intents"
    __table_args__ = (
        UniqueConstraint("merchant_id", "order_id", name="unique_merchant_order_id"),
    )

    # Primary Key  (pi_<hex>)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Merchant ownership
    merchant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("merchants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Intent details
    short_id = Column(String(32), unique=True, nullable=False, index=True)  # pi_xxxx — URL-friendly
    amount = Column(Integer, nullable=False)          # paise
    currency = Column(String(3), nullable=False, default="INR")
    order_id = Column(String(255), nullable=False)    # merchant-supplied, unique per merchant
    status = Column(
        Enum(PaymentIntentStatus, name="payment_intent_status_type",
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=PaymentIntentStatus.CREATED,
        index=True,
    )

    # Customer information (encrypted at rest)
    customer_name = Column(String)
    customer_email = Column(String)
    customer_phone = Column(String)

    # Signed link token (JWT)
    link_token = Column(String, nullable=False)

    # SprintNXT upstream references (populated when customer opens link)
    upstream_reference = Column(String(255), index=True)
    upstream_merchant_id = Column(String(255))
    upi_intent_url = Column(String)

    # Payment result
    payer_vpa = Column(String)
    rrn = Column(String(50))
    bank_name = Column(String(100))
    error_code = Column(String(50))
    error_description = Column(String)

    # Metadata
    notes = Column(JSON, default={})
    extra_data = Column(JSON, default={})

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False, index=True)
    paid_at = Column(DateTime)

    # Relationships
    merchant = relationship("Merchant")

    def __repr__(self):
        return f"<PaymentIntent {self.short_id} — {self.status}>"
