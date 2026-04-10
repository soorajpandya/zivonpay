"""
Order Schemas - Pydantic models for order requests/responses
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class CustomerInfo(BaseModel):
    """Customer information schema"""
    name: str = Field(..., min_length=2, max_length=255)
    mobile: str = Field(..., pattern=r'^[6-9]\d{9}$')
    email: Optional[str] = Field(None, pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    class Config:
        schema_extra = {
            "example": {
                "name": "Rahul Sharma",
                "mobile": "8877664543",
                "email": "rahul@example.com"
            }
        }


class OrderCreate(BaseModel):
    """Schema for creating an order"""
    amount: int = Field(..., gt=0, description="Amount in smallest currency unit (paise)")
    currency: str = Field(default="INR", pattern=r'^INR$')
    receipt: str = Field(..., min_length=1, max_length=255, description="Merchant's order reference")
    customer: CustomerInfo
    notes: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    @validator('amount')
    def validate_amount(cls, v):
        if v < 100:  # Minimum 1 rupee
            raise ValueError("Amount must be at least 100 paise (₹1)")
        if v > 10000000:  # Maximum 1 lakh rupees
            raise ValueError("Amount cannot exceed 10000000 paise (₹100,000)")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "amount": 1000,
                "currency": "INR",
                "receipt": "order_123",
                "customer": {
                    "name": "Rahul Sharma",
                    "mobile": "8877664543"
                },
                "notes": {
                    "description": "Pay For 1 Rupees"
                }
            }
        }


class OrderResponse(BaseModel):
    """Schema for order response"""
    id: UUID
    entity: str = "order"
    amount: int
    currency: str
    status: str
    receipt: str
    upi_intent_url: Optional[str] = None
    qr_code_url: Optional[str] = None
    notes: Optional[Dict[str, Any]] = None
    created_at: int  # Unix timestamp
    expires_at: Optional[int] = None
    paid_at: Optional[int] = None
    
    class Config:
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "entity": "order",
                "amount": 1000,
                "currency": "INR",
                "status": "qr_generated",
                "receipt": "order_123",
                "upi_intent_url": "upi://pay?pa=ps1.sprintnxt@fin&pn=ZivonPay&am=10.00...",
                "qr_code_url": None,
                "notes": {"description": "Pay For 1 Rupees"},
                "created_at": 1709049451,
                "expires_at": None,
                "paid_at": None
            }
        }


class OrderListResponse(BaseModel):
    """Schema for list of orders"""
    entity: str = "list"
    count: int
    data: list[OrderResponse]
    
    class Config:
        schema_extra = {
            "example": {
                "entity": "list",
                "count": 1,
                "data": []
            }
        }
