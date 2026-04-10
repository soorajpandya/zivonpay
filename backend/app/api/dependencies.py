"""
Authentication Dependencies and Utilities
"""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import secrets
import base64
from uuid import UUID

from app.database import get_db
from app.models.merchant import Merchant, EnvironmentType
from app.core.security import verify_password, verify_token
from app.redis_client import redis_client
from app.core.exceptions import (
    AuthenticationError,
    InvalidAPIKeyError,
    MissingAPIKeyError
)
import json
import logging

logger = logging.getLogger(__name__)

security = HTTPBasic()
bearer_security = HTTPBearer()


async def get_current_merchant(
    credentials: HTTPBasicCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Merchant:
    """
    Authenticate merchant using HTTP Basic Auth
    
    Format: Basic base64(key_id:key_secret)
    
    Args:
        credentials: HTTP Basic credentials
        db: Database session
        
    Returns:
        Authenticated Merchant object
        
    Raises:
        AuthenticationError: If authentication fails
    """
    # Extract key_id and key_secret
    key_id = credentials.username
    key_secret = credentials.password
    
    if not key_id or not key_secret:
        raise MissingAPIKeyError()
    
    # Determine if this is a sandbox or live key by prefix
    # Support both new (zp_live_) and legacy (key_live) prefixes
    is_live_key = key_id.startswith("zp_live_") or key_id.startswith("key_live")
    
    # Query merchant by the appropriate key column
    if is_live_key:
        stmt = select(Merchant).where(
            Merchant.live_api_key_id == key_id,
            Merchant.is_active == True
        )
    else:
        stmt = select(Merchant).where(
            Merchant.api_key_id == key_id,
            Merchant.is_active == True
        )
    result = await db.execute(stmt)
    merchant = result.scalar_one_or_none()
    
    if not merchant:
        logger.warning(f"Invalid API key attempt: {key_id}")
        raise InvalidAPIKeyError()
    
    # Verify secret against the correct hash
    secret_hash = merchant.live_api_secret_hash if is_live_key else merchant.api_secret_hash
    if not secret_hash or not verify_password(key_secret, secret_hash):
        logger.warning(f"Invalid API secret for key: {key_id}")
        raise InvalidAPIKeyError()
    
    # Set environment based on which key was used
    merchant.environment = EnvironmentType.PRODUCTION if is_live_key else EnvironmentType.SANDBOX
    
    # Update last active timestamp
    from datetime import datetime
    merchant.last_active_at = datetime.utcnow()
    await db.commit()
    
    logger.info(
        f"Merchant authenticated",
        extra={
            "merchant_id": str(merchant.id),
            "business_name": merchant.business_name,
            "environment": merchant.environment.value
        }
    )
    
    return merchant


async def get_current_merchant_jwt(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_security),
    db: AsyncSession = Depends(get_db)
) -> Merchant:
    """
    Authenticate merchant using JWT Bearer token.
    Uses Redis cache. On cache miss, queries DB via injected session.

    Format: Authorization: Bearer <jwt_token>
    """
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise AuthenticationError("Invalid or expired token")

    merchant_id = payload.get("sub")
    if not merchant_id:
        raise AuthenticationError("Invalid token payload")

    # Try Redis cache first — skip DB entirely on hit
    cache_key = f"merchant:{merchant_id}"
    cached = await redis_client.get(cache_key)
    if cached:
        try:
            data = json.loads(cached)
            from app.models.merchant import EnvironmentType
            merchant = Merchant(
                id=UUID(data["id"]),
                business_name=data["business_name"],
                email=data["email"],
                is_active=data["is_active"],
            )
            merchant.environment = EnvironmentType(data["environment"])
            return merchant
        except Exception:
            pass  # Fall through to DB lookup

    try:
        stmt = select(Merchant).where(
            Merchant.id == UUID(merchant_id),
            Merchant.is_active == True
        )
        result = await db.execute(stmt)
        merchant = result.scalar_one_or_none()
    except (ValueError, Exception) as e:
        logger.warning(f"JWT auth failed: {e}")
        raise AuthenticationError("Invalid token")

    if not merchant:
        raise AuthenticationError("Merchant not found or inactive")

    # Cache merchant for 5 minutes
    await redis_client.set(cache_key, json.dumps({
        "id": str(merchant.id),
        "business_name": merchant.business_name,
        "email": merchant.email,
        "environment": merchant.environment.value,
        "is_active": merchant.is_active,
    }), expire=300)

    logger.info(
        f"Merchant authenticated via JWT",
        extra={
            "merchant_id": str(merchant.id),
            "business_name": merchant.business_name,
            "environment": merchant.environment.value
        }
    )

    return merchant


async def get_optional_merchant(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[Merchant]:
    """
    Optional authentication - returns None if no auth provided
    Used for public endpoints that may benefit from merchant context
    """
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Basic "):
        return None
    
    try:
        # Decode Basic auth
        encoded = auth_header.replace("Basic ", "")
        decoded = base64.b64decode(encoded).decode()
        key_id, key_secret = decoded.split(":", 1)
        
        # Determine key type
        is_live_key = key_id.startswith("key_live")
        
        # Query merchant by appropriate key column
        if is_live_key:
            stmt = select(Merchant).where(
                Merchant.live_api_key_id == key_id,
                Merchant.is_active == True
            )
        else:
            stmt = select(Merchant).where(
                Merchant.api_key_id == key_id,
                Merchant.is_active == True
            )
        result = await db.execute(stmt)
        merchant = result.scalar_one_or_none()
        
        if merchant:
            secret_hash = merchant.live_api_secret_hash if is_live_key else merchant.api_secret_hash
            if secret_hash and verify_password(key_secret, secret_hash):
                merchant.environment = EnvironmentType.PRODUCTION if is_live_key else EnvironmentType.SANDBOX
                return merchant
        
    except Exception as e:
        logger.debug(f"Optional auth failed: {e}")
    
    return None


def verify_environment(merchant: Merchant, required_env: str):
    """
    Verify merchant is in the correct environment
    
    Args:
        merchant: Merchant object
        required_env: Required environment ('sandbox' or 'production')
        
    Raises:
        AuthenticationError: If environment mismatch
    """
    if merchant.environment.value != required_env:
        raise AuthenticationError(
            f"This endpoint requires {required_env} environment credentials"
        )
