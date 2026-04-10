"""
HMAC Request Signing & Verification — The REAL security layer.

Signature = HMAC-SHA256(signing_secret, method + path + body_hash + timestamp)

This is the layer that actually prevents:
- Request tampering
- Replay attacks
- Credential theft (even if key_id is leaked, signing_secret is separate)

Similar to Stripe's webhook signature verification, but applied to ALL inbound API requests.
"""

import hashlib
import hmac
import time
from typing import Optional, Tuple


# ── Signature generation (client-side logic, mirrored here for verification) ──

def compute_request_signature(
    signing_secret: str,
    method: str,
    path: str,
    body: bytes,
    timestamp: str,
) -> str:
    """
    Compute HMAC-SHA256 signature for a request.

    Canonical string = METHOD + \n + PATH + \n + SHA256(body) + \n + TIMESTAMP

    Args:
        signing_secret: The merchant's signing secret (plaintext)
        method:         HTTP method (GET, POST, etc.)
        path:           Request path (e.g., /v1/orders)
        body:           Raw request body bytes (b"" for GET)
        timestamp:      Unix timestamp string

    Returns:
        Hex-encoded HMAC-SHA256 signature
    """
    body_hash = hashlib.sha256(body).hexdigest()

    canonical = f"{method.upper()}\n{path}\n{body_hash}\n{timestamp}"

    sig = hmac.new(
        signing_secret.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return sig


def verify_request_signature(
    signing_secret: str,
    method: str,
    path: str,
    body: bytes,
    timestamp: str,
    provided_signature: str,
) -> bool:
    """
    Verify an HMAC-SHA256 request signature using constant-time comparison.

    Returns True if the signature matches.
    """
    expected = compute_request_signature(signing_secret, method, path, body, timestamp)
    return hmac.compare_digest(expected, provided_signature)


# ── Timestamp validation ──

def validate_timestamp(
    timestamp_str: str,
    tolerance_seconds: int = 300,
) -> Tuple[bool, Optional[str]]:
    """
    Validate that the timestamp is within ±tolerance of server time.

    Returns:
        (is_valid, error_message_or_none)
    """
    try:
        ts = int(timestamp_str)
    except (ValueError, TypeError):
        return False, "x-timestamp must be a valid unix epoch integer"

    now = int(time.time())
    drift = abs(now - ts)

    if drift > tolerance_seconds:
        return False, f"Request timestamp expired (drift={drift}s, max={tolerance_seconds}s)"

    return True, None


# ── Replay nonce key helper ──

def replay_cache_key(signature: str) -> str:
    """Redis key for replay detection."""
    return f"zp:replay:{signature}"


# ── Device fingerprint helper ──

def compute_device_fingerprint(
    user_agent: str,
    client_ip: str,
    accept_language: str = "",
    custom_device_id: str = "",
) -> str:
    """
    Compute a deterministic device fingerprint from request metadata.
    Not strong on its own (spoofable), but useful for anomaly detection.

    Returns SHA256 hex digest.
    """
    raw = f"{user_agent}|{client_ip}|{accept_language}|{custom_device_id}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
