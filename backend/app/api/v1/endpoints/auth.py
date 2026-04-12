"""
Authentication endpoints for merchant signup and login
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets
import uuid
from datetime import datetime

from app.database import get_db
from app.models.merchant import Merchant, EnvironmentType
from app.schemas.auth import (
    MerchantSignupRequest,
    MerchantSignupResponse,
    MerchantLoginRequest,
    TokenResponse,
    MerchantResponse,
    APICredentials
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.config import settings

router = APIRouter()


def generate_api_credentials(environment: str = "sandbox") -> tuple[str, str]:
    """Generate API key ID and secret with zp_test_ / zp_live_ prefixes"""
    prefix = "zp_test" if environment == "sandbox" else "zp_live"
    key_id = f"{prefix}_{secrets.token_urlsafe(16)}"
    secret = f"{prefix}_{secrets.token_urlsafe(32)}"
    return key_id, secret


def generate_webhook_secret(environment: str = "sandbox") -> str:
    """Generate webhook secret"""
    return f"whsec_{environment}_{secrets.token_urlsafe(32)}"


@router.post(
    "/signup",
    response_model=MerchantSignupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Merchant Signup",
    description="Register a new merchant account and receive API credentials"
)
async def signup(
    signup_data: MerchantSignupRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new merchant account.
    
    Returns:
    - Merchant details
    - API credentials (key_id and secret)
    - Webhook secret (if webhook_url provided)
    - JWT access token
    
    **Important**: The API secret and webhook secret are shown only once.
    Store them securely as they cannot be retrieved later.
    """
    # Check if email already exists
    stmt = select(Merchant).where(Merchant.email == signup_data.email)
    result = await db.execute(stmt)
    existing_merchant = result.scalar_one_or_none()
    
    if existing_merchant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate sandbox API credentials only (live keys issued after verification)
    sandbox_key_id, sandbox_secret = generate_api_credentials("sandbox")
    sandbox_secret_hash = hash_password(sandbox_secret)
    
    # Generate webhook secret if URL provided
    webhook_secret = None
    webhook_secret_hash = None
    if signup_data.webhook_url:
        webhook_secret = generate_webhook_secret(settings.ENVIRONMENT)
        webhook_secret_hash = hash_password(webhook_secret)
    
    # Hash password
    password_hash = hash_password(signup_data.password)
    
    # Create merchant with sandbox keys only (no live keys at signup)
    merchant = Merchant(
        id=uuid.uuid4(),
        business_name=signup_data.business_name,
        email=signup_data.email,
        mobile=signup_data.mobile,
        api_key_id=sandbox_key_id,
        api_secret_hash=sandbox_secret_hash,
        live_api_key_id=None,
        live_api_secret_hash=None,
        webhook_url=signup_data.webhook_url,
        webhook_secret_hash=webhook_secret_hash,
        environment=EnvironmentType.SANDBOX,
        is_active=True,
        is_verified=False,
        extra_data={"password_hash": password_hash},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(merchant)
    await db.commit()
    await db.refresh(merchant)
    
    # Generate JWT token
    access_token = create_access_token(
        data={"sub": str(merchant.id), "email": merchant.email}
    )
    
    return MerchantSignupResponse(
        merchant=MerchantResponse.model_validate(merchant),
        sandbox_credentials=APICredentials(
            key_id=sandbox_key_id,
            key_secret=sandbox_secret
        ),
        live_credentials=None,
        webhook_secret=webhook_secret,
        auth=TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Merchant Login",
    description="Authenticate merchant and receive JWT access token"
)
async def login(
    login_data: MerchantLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate merchant with email and password.
    
    Returns JWT access token for API authentication.
    """
    # Find merchant by email
    stmt = select(Merchant).where(Merchant.email == login_data.email)
    result = await db.execute(stmt)
    merchant = result.scalar_one_or_none()
    
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    password_hash = merchant.extra_data.get("password_hash")
    if not password_hash or not verify_password(login_data.password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if account is active
    if not merchant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support."
        )
    
    # Update last active timestamp
    merchant.last_active_at = datetime.utcnow()
    await db.commit()
    
    # Generate JWT token
    access_token = create_access_token(
        data={"sub": str(merchant.id), "email": merchant.email}
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
