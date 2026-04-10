"""
Authentication schemas for merchant signup and login
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


class MerchantSignupRequest(BaseModel):
    """Request schema for merchant signup"""
    business_name: str = Field(..., min_length=2, max_length=255, description="Business name")
    email: EmailStr = Field(..., description="Business email address")
    mobile: Optional[str] = Field(None, max_length=15, description="Mobile number")
    password: str = Field(..., min_length=8, max_length=100, description="Account password")
    webhook_url: Optional[str] = Field(None, description="Webhook URL for notifications")
    
    class Config:
        json_schema_extra = {
            "example": {
                "business_name": "My Business",
                "email": "business@example.com",
                "mobile": "+919876543210",
                "password": "SecurePass123!",
                "webhook_url": "https://example.com/webhook"
            }
        }


class MerchantLoginRequest(BaseModel):
    """Request schema for merchant login"""
    email: EmailStr = Field(..., description="Business email address")
    password: str = Field(..., description="Account password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "business@example.com",
                "password": "SecurePass123!"
            }
        }


class TokenResponse(BaseModel):
    """Response schema for authentication token"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiry in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 3600
            }
        }


class MerchantResponse(BaseModel):
    """Response schema for merchant data"""
    id: UUID = Field(..., description="Merchant ID")
    business_name: str = Field(..., description="Business name")
    email: str = Field(..., description="Business email")
    mobile: Optional[str] = Field(None, description="Mobile number")
    api_key_id: str = Field(..., description="API Key ID")
    environment: str = Field(..., description="Environment (sandbox/production)")
    is_active: bool = Field(..., description="Account active status")
    is_verified: bool = Field(..., description="Account verification status")
    webhook_url: Optional[str] = Field(None, description="Webhook URL")
    created_at: datetime = Field(..., description="Account creation timestamp")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "business_name": "My Business",
                "email": "business@example.com",
                "mobile": "+919876543210",
                "api_key_id": "key_test_abc123",
                "environment": "sandbox",
                "is_active": True,
                "is_verified": False,
                "webhook_url": "https://example.com/webhook",
                "created_at": "2026-03-02T10:00:00Z"
            }
        }


class MerchantSignupResponse(BaseModel):
    """Response schema for merchant signup"""
    merchant: MerchantResponse
    api_secret: str = Field(..., description="API Secret (store securely, shown only once)")
    webhook_secret: Optional[str] = Field(None, description="Webhook secret (store securely, shown only once)")
    auth: TokenResponse
    
    class Config:
        json_schema_extra = {
            "example": {
                "merchant": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "business_name": "My Business",
                    "email": "business@example.com",
                    "api_key_id": "key_test_abc123",
                    "environment": "sandbox",
                    "is_active": True,
                    "is_verified": False
                },
                "api_secret": "sec_test_xyz789_keep_this_secret",
                "webhook_secret": "whsec_test_abc123_keep_this_secret",
                "auth": {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "token_type": "bearer",
                    "expires_in": 3600
                }
            }
        }
