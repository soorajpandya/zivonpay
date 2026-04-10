"""
Payment Intent Schemas — request / response models for the Payment Link API
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from uuid import UUID


# ── Request ────────────────────────────────────────────────────────────────────

class PaymentIntentCreate(BaseModel):
    """Schema for POST /v1/payment-intent"""
    amount: int = Field(..., gt=0, description="Amount in smallest currency unit (paise)")
    currency: str = Field(default="INR", pattern=r"^INR$")
    order_id: str = Field(..., min_length=1, max_length=255, description="Merchant-side unique order reference")
    customer_name: str = Field(..., min_length=2, max_length=255)
    customer_email: Optional[str] = Field(
        None,
        pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
    )
    customer_phone: str = Field(..., pattern=r"^[6-9]\d{9}$")
    expiry_minutes: Optional[int] = Field(
        default=15, ge=1, le=1440,
        description="Link expiry in minutes (default 15, max 24 h)",
    )
    notes: Optional[Dict[str, Any]] = Field(default_factory=dict)

    @validator("amount")
    def validate_amount(cls, v):
        if v < 100:
            raise ValueError("Amount must be at least 100 paise (₹1)")
        if v > 10_000_000:
            raise ValueError("Amount cannot exceed 10 000 000 paise (₹1,00,000)")
        return v

    class Config:
        schema_extra = {
            "example": {
                "amount": 1000,
                "currency": "INR",
                "order_id": "ORD12345",
                "customer_name": "Suraj Pandya",
                "customer_email": "example@email.com",
                "customer_phone": "9999999999",
                "expiry_minutes": 30,
            }
        }


# ── Response ───────────────────────────────────────────────────────────────────

class PaymentIntentResponse(BaseModel):
    """Returned after creating or fetching a payment intent"""
    status: str
    payment_intent_id: str
    payment_link: str
    amount: int
    currency: str
    order_id: str
    intent_status: str
    expires_at: str           # ISO-8601 UTC
    created_at: int           # unix ts
    paid_at: Optional[int] = None

    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "payment_intent_id": "pi_a1b2c3d4e5f6",
                "payment_link": "https://api.zivonpay.com/link/pi_a1b2c3d4e5f6?token=<jwt>",
                "amount": 1000,
                "currency": "INR",
                "order_id": "ORD12345",
                "intent_status": "created",
                "expires_at": "2026-03-04T10:30:00Z",
                "created_at": 1709049451,
                "paid_at": None,
            }
        }


class PaymentIntentListResponse(BaseModel):
    """Paginated list of payment intents"""
    entity: str = "list"
    count: int
    data: List[PaymentIntentResponse]


# ── Public page data (no sensitive fields) ─────────────────────────────────────

class PaymentPageData(BaseModel):
    """Data rendered on the hosted payment page"""
    payment_intent_id: str
    amount: int
    currency: str
    order_id: str
    customer_name: str
    status: str
    expires_at: str
    upi_intent_url: Optional[str] = None
    qr_image_url: Optional[str] = None
