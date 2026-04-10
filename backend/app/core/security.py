"""
Security utilities for encryption, hashing, and authentication
"""

import bcrypt
from cryptography.fernet import Fernet
from jose import JWTError, jwt
from datetime import datetime, timedelta
import secrets
import hashlib
import hmac
from typing import Optional
from app.config import settings

# Encryption cipher
cipher = Fernet(settings.ENCRYPTION_KEY.encode())


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    # Truncate to 72 bytes (bcrypt limit)
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        return False


def encrypt_data(data: str) -> str:
    """Encrypt sensitive data using AES-256"""
    if not data:
        return ""
    return cipher.encrypt(data.encode()).decode()


def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    if not encrypted_data:
        return ""
    try:
        return cipher.decrypt(encrypted_data.encode()).decode()
    except Exception:
        return ""


def generate_api_key(environment: str = "sandbox") -> tuple[str, str]:
    """
    Generate API key pair (key_id, key_secret)
    
    Returns:
        tuple: (key_id, key_secret)
    """
    prefix = "zp_test_" if environment == "sandbox" else "zp_live_"
    
    # Generate random key
    random_key = secrets.token_urlsafe(24)
    key_id = f"{prefix}{random_key}"
    
    # Generate secret
    key_secret = secrets.token_urlsafe(32)
    
    return key_id, key_secret


def generate_webhook_secret() -> str:
    """Generate webhook signing secret"""
    return secrets.token_urlsafe(32)


def create_webhook_signature(payload: str, secret: str, timestamp: int) -> str:
    """
    Create HMAC-SHA256 signature for webhook
    
    Args:
        payload: JSON string payload
        secret: Webhook secret
        timestamp: Unix timestamp
        
    Returns:
        Signature string
    """
    signed_payload = f"{timestamp}.{payload}"
    signature = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return signature


def verify_webhook_signature(
    payload: str,
    signature: str,
    secret: str,
    timestamp: int,
    tolerance: int = 300
) -> bool:
    """
    Verify webhook signature
    
    Args:
        payload: JSON string payload
        signature: Provided signature
        secret: Webhook secret
        timestamp: Unix timestamp from header
        tolerance: Time tolerance in seconds (default 5 minutes)
        
    Returns:
        True if valid, False otherwise
    """
    # Check timestamp tolerance (prevent replay attacks)
    current_time = int(datetime.utcnow().timestamp())
    if abs(current_time - timestamp) > tolerance:
        return False
    
    # Verify signature
    expected_signature = create_webhook_signature(payload, secret, timestamp)
    return hmac.compare_digest(signature, expected_signature)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    
    Args:
        data: Data to encode in token
        expires_delta: Optional expiration time delta
        
    Returns:
        JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token data or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def generate_idempotency_key() -> str:
    """Generate unique idempotency key"""
    return secrets.token_urlsafe(32)


def hash_request_body(body: str) -> str:
    """Hash request body for idempotency check"""
    return hashlib.sha256(body.encode()).hexdigest()
