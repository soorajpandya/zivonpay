"""
Error Schemas - Pydantic models for error responses
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any


class ErrorDetail(BaseModel):
    """Schema for error detail"""
    code: str
    description: str
    source: str
    step: Optional[str] = None
    reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "code": "BAD_REQUEST_ERROR",
                "description": "Invalid amount",
                "source": "business",
                "step": "order_creation",
                "reason": "validation_failed",
                "metadata": {}
            }
        }


class ErrorResponse(BaseModel):
    """Schema for error response"""
    error: ErrorDetail
    
    class Config:
        schema_extra = {
            "example": {
                "error": {
                    "code": "BAD_REQUEST_ERROR",
                    "description": "Invalid amount",
                    "source": "business",
                    "step": "order_creation",
                    "reason": "validation_failed",
                    "metadata": {}
                }
            }
        }
