"""
Custom exceptions for ZivonPay API
Provides structured error responses
"""

from typing import Optional, Dict, Any
from fastapi import status


class ZivonPayException(Exception):
    """Base exception for all ZivonPay errors"""
    
    def __init__(
        self,
        error_code: str,
        description: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        source: str = "business",
        step: Optional[str] = None,
        reason: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.error_code = error_code
        self.description = description
        self.status_code = status_code
        self.source = source
        self.step = step
        self.reason = reason
        self.metadata = metadata or {}
        super().__init__(description)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary format"""
        error_dict = {
            "error": {
                "code": self.error_code,
                "description": self.description,
                "source": self.source,
            }
        }
        
        if self.step:
            error_dict["error"]["step"] = self.step
        
        if self.reason:
            error_dict["error"]["reason"] = self.reason
        
        if self.metadata:
            error_dict["error"]["metadata"] = self.metadata
        
        return error_dict


# Authentication Exceptions
class AuthenticationError(ZivonPayException):
    """Raised when authentication fails"""
    
    def __init__(self, description: str = "Authentication failed"):
        super().__init__(
            error_code="AUTHENTICATION_ERROR",
            description=description,
            status_code=status.HTTP_401_UNAUTHORIZED,
            source="authentication",
            reason="invalid_credentials"
        )


class InvalidAPIKeyError(AuthenticationError):
    """Raised when API key is invalid"""
    
    def __init__(self):
        super().__init__(description="Invalid API key provided")


class MissingAPIKeyError(AuthenticationError):
    """Raised when API key is missing"""
    
    def __init__(self):
        super().__init__(description="API key required")


# Validation Exceptions
class ValidationError(ZivonPayException):
    """Raised when request validation fails"""
    
    def __init__(self, description: str, field: Optional[str] = None):
        metadata = {"field": field} if field else {}
        super().__init__(
            error_code="BAD_REQUEST_ERROR",
            description=description,
            status_code=status.HTTP_400_BAD_REQUEST,
            source="business",
            step="validation",
            reason="validation_failed",
            metadata=metadata
        )


class InvalidAmountError(ValidationError):
    """Raised when amount is invalid"""
    
    def __init__(self, amount: Any):
        super().__init__(
            description=f"Invalid amount: {amount}. Amount must be a positive integer.",
            field="amount"
        )


class InvalidCurrencyError(ValidationError):
    """Raised when currency is invalid"""
    
    def __init__(self, currency: str):
        super().__init__(
            description=f"Invalid currency: {currency}. Only INR is supported.",
            field="currency"
        )


# Resource Exceptions
class ResourceNotFoundError(ZivonPayException):
    """Raised when a resource is not found"""
    
    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            error_code="NOT_FOUND_ERROR",
            description=f"{resource_type} not found: {resource_id}",
            status_code=status.HTTP_404_NOT_FOUND,
            source="business",
            reason="resource_not_found",
            metadata={"resource_type": resource_type, "resource_id": resource_id}
        )


class OrderNotFoundError(ResourceNotFoundError):
    """Raised when order is not found"""
    
    def __init__(self, order_id: str):
        super().__init__(resource_type="Order", resource_id=order_id)


class PaymentNotFoundError(ResourceNotFoundError):
    """Raised when payment is not found"""
    
    def __init__(self, payment_id: str):
        super().__init__(resource_type="Payment", resource_id=payment_id)


# Business Logic Exceptions
class OrderAlreadyPaidError(ZivonPayException):
    """Raised when trying to pay an already paid order"""
    
    def __init__(self, order_id: str):
        super().__init__(
            error_code="ORDER_ALREADY_PAID",
            description=f"Order {order_id} is already paid",
            status_code=status.HTTP_400_BAD_REQUEST,
            source="business",
            step="payment_processing",
            reason="duplicate_payment"
        )


class OrderExpiredError(ZivonPayException):
    """Raised when order has expired"""
    
    def __init__(self, order_id: str):
        super().__init__(
            error_code="ORDER_EXPIRED",
            description=f"Order {order_id} has expired",
            status_code=status.HTTP_400_BAD_REQUEST,
            source="business",
            reason="order_expired"
        )


# Rate Limiting Exceptions
class RateLimitExceededError(ZivonPayException):
    """Raised when rate limit is exceeded"""
    
    def __init__(self, limit: int, window: str = "minute"):
        super().__init__(
            error_code="RATE_LIMIT_EXCEEDED",
            description=f"Rate limit exceeded. Maximum {limit} requests per {window}.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            source="system",
            reason="rate_limit",
            metadata={"limit": limit, "window": window}
        )


# Upstream Service Exceptions
class UpstreamServiceError(ZivonPayException):
    """Raised when upstream service (SprintNXT) fails"""
    
    def __init__(self, description: str, service: str = "SprintNXT"):
        super().__init__(
            error_code="GATEWAY_ERROR",
            description=description,
            status_code=status.HTTP_502_BAD_GATEWAY,
            source="gateway",
            reason="upstream_service_error",
            metadata={"service": service}
        )


class UpstreamTimeoutError(UpstreamServiceError):
    """Raised when upstream service times out"""
    
    def __init__(self):
        super().__init__(
            description="Upstream service timeout. Please try again.",
        )


class UpstreamInvalidResponseError(UpstreamServiceError):
    """Raised when upstream service returns invalid response"""
    
    def __init__(self):
        super().__init__(
            description="Invalid response from upstream service",
        )


# Idempotency Exceptions
class IdempotencyConflictError(ZivonPayException):
    """Raised when idempotency key is reused with different request"""
    
    def __init__(self):
        super().__init__(
            error_code="IDEMPOTENCY_CONFLICT",
            description="Idempotency key reused with different request body",
            status_code=status.HTTP_409_CONFLICT,
            source="system",
            reason="idempotency_conflict"
        )


class DuplicateOrderError(ZivonPayException):
    """Raised when a payment intent already exists for the given order_id"""

    def __init__(self, order_id: str, current_status: str):
        super().__init__(
            error_code="DUPLICATE_ORDER_ID",
            description=(
                f"A payment intent for order_id '{order_id}' already exists "
                f"with status '{current_status}'. Use a unique order_id."
            ),
            status_code=status.HTTP_409_CONFLICT,
            source="validation",
            reason="duplicate_order_id",
        )


# ── Security Layer Exceptions ──

class ForbiddenError(ZivonPayException):
    """Raised when request is forbidden (IP, domain, mTLS, replay)"""

    def __init__(self, description: str = "Access denied", reason: str = "forbidden"):
        super().__init__(
            error_code="FORBIDDEN",
            description=description,
            status_code=status.HTTP_403_FORBIDDEN,
            source="security",
            reason=reason,
        )


class InvalidSignatureError(ZivonPayException):
    """Raised when HMAC request signature is invalid"""

    def __init__(self, description: str = "Invalid request signature"):
        super().__init__(
            error_code="INVALID_SIGNATURE",
            description=description,
            status_code=status.HTTP_401_UNAUTHORIZED,
            source="security",
            reason="signature_mismatch",
        )


class ReplayAttackError(ZivonPayException):
    """Raised when a replay attack is detected"""

    def __init__(self):
        super().__init__(
            error_code="REPLAY_DETECTED",
            description="Replay detected — duplicate request signature",
            status_code=status.HTTP_403_FORBIDDEN,
            source="security",
            reason="replay_attack",
        )
