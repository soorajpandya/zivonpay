"""
Audit Schemas - Pydantic models for audit log requests/responses
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime


class AuditLogResponse(BaseModel):
    """Schema for a single audit log entry"""
    id: UUID
    merchant_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[UUID] = None
    request_id: Optional[str] = None
    endpoint: Optional[str] = None
    http_method: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None
    extra_data: Optional[Dict[str, Any]] = None
    created_at: int  # Unix timestamp

    class Config:
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "merchant_id": "660e8400-e29b-41d4-a716-446655440000",
                "action": "order.create",
                "entity_type": "order",
                "entity_id": "770e8400-e29b-41d4-a716-446655440000",
                "endpoint": "/v1/orders",
                "http_method": "POST",
                "changes": {"status": {"old": None, "new": "qr_generated"}},
                "created_at": 1709049451
            }
        }


class AuditLogListResponse(BaseModel):
    """Schema for list of audit logs"""
    entity: str = "list"
    count: int
    data: List[AuditLogResponse]
