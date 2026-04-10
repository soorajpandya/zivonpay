"""
Configuration Management for ZivonPay Backend
Handles environment variables and application settings
"""

import os
from typing import List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import Field, validator
import secrets

# Determine which .env file to load based on APP_ENV environment variable
# Usage: APP_ENV=production python -m uvicorn ...
# Defaults to "development" if not set
_app_env = os.getenv("APP_ENV", "development")
_env_file = f".env.{_app_env}"

# Fall back to .env if the environment-specific file doesn't exist
if not os.path.isfile(_env_file):
    _env_file = ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "ZivonPay API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="sandbox", pattern="^(sandbox|production)$")
    DEBUG: bool = False
    
    # API Configuration
    API_V1_PREFIX: str = "/v1"
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # IP Whitelist (comma-separated IPs allowed to access API)
    ALLOWED_IPS: Union[str, List[str]] = ["127.0.0.1"]
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 40
    DATABASE_ECHO: bool = False
    
    # Supabase Configuration (Optional)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    SUPABASE_PUBLISHABLE_KEY: Optional[str] = None
    
    # Redis
    REDIS_URL: str
    REDIS_MAX_CONNECTIONS: int = 50
    
    # SprintNXT UPI Configuration
    SPRINTNXT_BASE_URL: str
    SPRINTNXT_CLIENT_ID: str
    SPRINTNXT_TOKEN: str
    SPRINTNXT_API_ID: str = "20260"
    SPRINTNXT_BANK_ID: str = "3"
    SPRINTNXT_PAYEE_VPA: str = "ps1.sprintnxt@fin"
    SPRINTNXT_TIMEOUT: int = 30
    
    # Security
    JWT_SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    ENCRYPTION_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    
    # Rate Limiting
    RATE_LIMIT_ORDERS_CREATE: int = 1000  # per minute
    RATE_LIMIT_ORDERS_FETCH: int = 5000   # per minute
    RATE_LIMIT_ENABLED: bool = True
    
    # Webhook Configuration
    WEBHOOK_TIMEOUT: int = 30
    WEBHOOK_RETRY_COUNT: int = 3
    WEBHOOK_REPLAY_TOLERANCE: int = 300  # seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    PROMETHEUS_PORT: int = 9090
    
    # Idempotency
    IDEMPOTENCY_KEY_EXPIRY: int = 86400  # 24 hours in seconds
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Try parsing as JSON first
            import json
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
            # Fall back to comma-separated
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("ALLOWED_IPS", pre=True)
    def parse_allowed_ips(cls, v):
        if isinstance(v, str):
            # Parse comma-separated IPs
            return [ip.strip() for ip in v.split(",") if ip.strip()]
        if isinstance(v, list):
            return v
        return ["127.0.0.1"]  # Default fallback
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        if v not in ["sandbox", "production"]:
            raise ValueError("ENVIRONMENT must be 'sandbox' or 'production'")
        return v
    
    class Config:
        env_file = _env_file
        case_sensitive = True


# Global settings instance
settings = Settings()


# Environment-specific URLs
def get_base_url() -> str:
    """Get the base URL based on environment"""
    if settings.ENVIRONMENT == "production":
        return "https://api.zivonpay.com"
    return "https://sandbox.api.zivonpay.com"


def get_dashboard_url() -> str:
    """Get the dashboard URL based on environment"""
    if settings.ENVIRONMENT == "production":
        return "https://dashboard.zivonpay.com"
    return "https://sandbox.dashboard.zivonpay.com"
