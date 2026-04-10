"""
Rate Limiting Middleware and Utilities
"""

from fastapi import Request, Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

from app.config import settings
from app.core.exceptions import RateLimitExceededError

logger = logging.getLogger(__name__)


# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["1000/minute"],
    storage_uri=settings.REDIS_URL if settings.RATE_LIMIT_ENABLED else "memory://",
    headers_enabled=True
)


def rate_limit_key_func(request: Request) -> str:
    """
    Custom key function for rate limiting
    Uses merchant ID if authenticated, otherwise IP address
    """
    # Try to get merchant ID from request state
    if hasattr(request.state, "merchant"):
        return f"merchant:{request.state.merchant.id}"
    
    # Fallback to IP address
    return get_remote_address(request)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded"""
    logger.warning(
        f"Rate limit exceeded",
        extra={
            "path": request.url.path,
            "ip": get_remote_address(request)
        }
    )
    
    raise RateLimitExceededError(
        limit=1000,  # Get from exception or config
        window="minute"
    )
