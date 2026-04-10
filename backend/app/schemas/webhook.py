"""
Webhook Schemas - Pydantic models for webhook payloads
"""

from pydantic import BaseModel
from typing import Dict, Any
from uuid import UUID


class WebhookPayload(BaseModel):
    """Schema for webhook payload"""
    event: str
    entity: str
    entity_id: UUID
    data: Dict[str, Any]
    timestamp: int
    
    class Config:
        schema_extra = {
            "example": {
                "event": "payment.captured",
                "entity": "payment",
                "entity_id": "660e8400-e29b-41d4-a716-446655440000",
                "data": {
                    "id": "660e8400-e29b-41d4-a716-446655440000",
                    "order_id": "550e8400-e29b-41d4-a716-446655440000",
                    "amount": 1000,
                    "currency": "INR",
                    "status": "captured"
                },
                "timestamp": 1709049455
            }
        }
