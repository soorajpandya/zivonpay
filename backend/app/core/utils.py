"""
Utility functions for ZivonPay API
"""

from datetime import datetime, timezone
from typing import Optional, Any, Dict
import re
import uuid


def generate_order_id() -> str:
    """Generate unique order ID"""
    return f"order_{uuid.uuid4().hex[:16]}"


def generate_payment_id() -> str:
    """Generate unique payment ID"""
    return f"pay_{uuid.uuid4().hex[:16]}"


def get_current_timestamp() -> int:
    """Get current Unix timestamp"""
    return int(datetime.now(timezone.utc).timestamp())


def get_current_datetime() -> datetime:
    """Get current UTC datetime (naive, for TIMESTAMP WITHOUT TIME ZONE columns)"""
    return datetime.utcnow()


def validate_mobile_number(mobile: str) -> bool:
    """
    Validate Indian mobile number
    
    Args:
        mobile: Mobile number string
        
    Returns:
        True if valid, False otherwise
    """
    pattern = r'^[6-9]\d{9}$'
    return bool(re.match(pattern, mobile))


def validate_email(email: str) -> bool:
    """
    Validate email address
    
    Args:
        email: Email address string
        
    Returns:
        True if valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_vpa(vpa: str) -> bool:
    """
    Validate UPI VPA (Virtual Payment Address)
    
    Args:
        vpa: VPA string (e.g., user@upi)
        
    Returns:
        True if valid, False otherwise
    """
    pattern = r'^[\w.-]+@[\w.-]+$'
    return bool(re.match(pattern, vpa))


def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize string input
    
    Args:
        value: String to sanitize
        max_length: Optional maximum length
        
    Returns:
        Sanitized string
    """
    if not value:
        return ""
    
    # Remove leading/trailing whitespace
    sanitized = value.strip()
    
    # Truncate if needed
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized


def format_amount(amount_in_paise: int) -> str:
    """
    Format amount in paise to rupees string
    
    Args:
        amount_in_paise: Amount in paise (smallest unit)
        
    Returns:
        Formatted string (e.g., "₹100.00")
    """
    rupees = amount_in_paise / 100
    return f"₹{rupees:.2f}"


def paise_to_rupees(amount_in_paise: int) -> float:
    """Convert paise to rupees"""
    return amount_in_paise / 100


def rupees_to_paise(amount_in_rupees: float) -> int:
    """Convert rupees to paise"""
    return int(amount_in_rupees * 100)


def mask_mobile(mobile: str) -> str:
    """
    Mask mobile number for logging
    
    Args:
        mobile: Mobile number
        
    Returns:
        Masked mobile (e.g., 98****4321)
    """
    if not mobile or len(mobile) < 6:
        return "******"
    
    return mobile[:2] + "****" + mobile[-4:]


def mask_vpa(vpa: str) -> str:
    """
    Mask UPI VPA for logging
    
    Args:
        vpa: VPA (e.g., user@upi)
        
    Returns:
        Masked VPA (e.g., us****@upi)
    """
    if not vpa or "@" not in vpa:
        return "****@***"
    
    parts = vpa.split("@")
    if len(parts[0]) <= 4:
        masked_user = "****"
    else:
        masked_user = parts[0][:2] + "****"
    
    return f"{masked_user}@{parts[1]}"


def create_pagination_metadata(
    total: int,
    page: int,
    page_size: int
) -> Dict[str, Any]:
    """
    Create pagination metadata
    
    Args:
        total: Total number of items
        page: Current page number
        page_size: Items per page
        
    Returns:
        Dictionary with pagination metadata
    """
    total_pages = (total + page_size - 1) // page_size
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
    }


def build_upi_intent_url(
    vpa: str,
    name: str,
    amount: float,
    transaction_ref: str,
    transaction_note: str
) -> str:
    """
    Build UPI intent URL
    
    Args:
        vpa: Payee VPA
        name: Payee name
        amount: Amount in rupees
        transaction_ref: Transaction reference
        transaction_note: Transaction note
        
    Returns:
        UPI intent URL
    """
    intent = (
        f"upi://pay?pa={vpa}"
        f"&pn={name}"
        f"&am={amount:.2f}"
        f"&tr={transaction_ref}"
        f"&tn={transaction_note}"
        f"&cu=INR"
    )
    
    return intent
