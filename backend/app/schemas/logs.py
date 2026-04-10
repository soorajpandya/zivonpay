"""
Logs Schemas - Pydantic models for application log requests/responses
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class AppLogResponse(BaseModel):
    """Schema for a single application log entry"""
    id: int
    timestamp: str
    level: str
    logger: Optional[str] = None
    message: str
    request_id: Optional[str] = None
    merchant_id: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None

    class Config:
        schema_extra = {
            "example": {
                "id": 1,
                "timestamp": "2026-03-03T12:00:00Z",
                "level": "INFO",
                "logger": "app.services.order",
                "message": "Order created",
                "request_id": "abc-123",
                "merchant_id": "660e8400-e29b-41d4-a716-446655440000",
                "extra": {"order_id": "770e8400-e29b-41d4-a716-446655440000"}
            }
        }


class AppLogListResponse(BaseModel):
    """Schema for list of application logs"""
    entity: str = "list"
    count: int
    total_in_buffer: int
    data: List[AppLogResponse]
