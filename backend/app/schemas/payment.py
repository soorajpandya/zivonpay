"""
Payment Schemas - Pydantic models for payment requests/responses
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class PaymentResponse(BaseModel):
    """Schema for payment response"""
    id: UUID
    entity: str = "payment"
    order_id: UUID
    amount: int
    currency: str
    status: str
    payer_vpa: Optional[str] = None
    rrn: Optional[str] = None
    transaction_id: Optional[str] = None
    bank_name: Optional[str] = None
    error_code: Optional[str] = None
    error_description: Optional[str] = None
    created_at: int
    captured_at: Optional[int] = None
    
    class Config:
        schema_extra = {
            "example": {
                "id": "660e8400-e29b-41d4-a716-446655440000",
                "entity": "payment",
                "order_id": "550e8400-e29b-41d4-a716-446655440000",
                "amount": 1000,
                "currency": "INR",
                "status": "captured",
                "payer_vpa": "user@upi",
                "rrn": "123456789012",
                "transaction_id": "TXN123456",
                "bank_name": "HDFC Bank",
                "error_code": None,
                "error_description": None,
                "created_at": 1709049451,
                "captured_at": 1709049455
            }
        }


class PaymentListResponse(BaseModel):
    """Schema for list of payments"""
    entity: str = "list"
    count: int
    data: list[PaymentResponse]
    
    class Config:
        schema_extra = {
            "example": {
                "entity": "list",
                "count": 1,
                "data": []
            }
        }
