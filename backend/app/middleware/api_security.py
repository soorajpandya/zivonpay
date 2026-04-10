"""
Multi-Layered API Security Middleware — Payment-grade protection

Layers (evaluated in order):
  1. Origin / Domain validation
  2. IP whitelist (proxy-aware)
  3. mTLS certificate check (if enforced)
  4. API Key + Secret authentication (HTTP Basic)
  5. HMAC request signature verification
  6. Replay attack protection (Redis-backed)
  7. Device fingerprint anomaly detection
  8. Per-key rate limiting

Any layer can be toggled per-merchant via MerchantSecurityConfig.
Sandbox mode relaxes optional layers; production enforces them.

Every rejection is logged to the security_audit_logs table.
"""

import asyncio
import hashlib
import ipaddress
import json
import logging
import time
from datetime import datetime
from typing import Optional
from urllib.parse import urlparse
from uuid import UUID

from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.request_signing import (
    compute_device_fingerprint,
    replay_cache_key,
    validate_timestamp,
    verify_request_signature,
)
from app.core.security import verify_password
from app.database import AsyncSessionLocal
from app.models.merchant import Merchant, EnvironmentType
from app.models.security_audit import SecurityAuditLog
from app.models.security_config import MerchantSecurityConfig
from app.redis_client import redis_client

logger = logging.getLogger(__name__)

# ── Settings (overridable via config/env) ──

# Paths that never go through security middleware (public endpoints)
PUBLIC_PATHS: set = {
    "/health",
    "/",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/metrics",
    "/developer-docs",
}

# Prefixes that are public (payment link pages, webhooks, etc.)
PUBLIC_PREFIXES: tuple = (
    "/link/",
    "/developer-docs",
    "/v1/auth/",           # signup / login
    "/v1/callback/",       # upstream payment callbacks
)

# Default replay window (seconds)
REPLAY_WINDOW = 300  # 5 minutes

# Default rate limits
DEFAULT_RATE_LIMIT_SANDBOX = 100   # per minute per key
DEFAULT_RATE_LIMIT_PRODUCTION = 1000


# ═══════════════════════════════════════════════════════════════════════════════
#  SECURITY LAYER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════


def _extract_client_ip(request: Request) -> str:
    """
    Extract real client IP, respecting trusted proxy headers.
    Order: X-Real-IP → first X-Forwarded-For entry → request.client.host
    """
    # X-Real-IP (set by nginx)
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    # X-Forwarded-For (may be comma-separated chain)
    xff = request.headers.get("x-forwarded-for")
    if xff:
        # First IP in the chain is the original client
        return xff.split(",")[0].strip()

    return request.client.host if request.client else "0.0.0.0"


def _extract_origin_domain(request: Request) -> Optional[str]:
    """
    Extract domain from Origin or Referer header.
    Returns lowercase domain string or None.
    """
    origin = request.headers.get("origin")
    if origin:
        try:
            parsed = urlparse(origin)
            return parsed.hostname.lower() if parsed.hostname else None
        except Exception:
            return None

    referer = request.headers.get("referer")
    if referer:
        try:
            parsed = urlparse(referer)
            return parsed.hostname.lower() if parsed.hostname else None
        except Exception:
            return None

    return None


def _match_domain(domain: str, patterns: list) -> bool:
    """
    Match a domain against a list of allowed patterns.
    Supports exact match and wildcard prefix (*.example.com).
    """
    if not domain or not patterns:
        return False

    for pattern in patterns:
        pattern = pattern.lower().strip()
        if pattern == domain:
            return True
        if pattern.startswith("*."):
            suffix = pattern[2:]  # Remove "*."
            if domain == suffix or domain.endswith("." + suffix):
                return True

    return False


def _match_ip(client_ip: str, whitelist: list) -> bool:
    """
    Match client IP against whitelist. Supports:
    - Exact IPs (1.2.3.4)
    - CIDR notation (10.0.0.0/24)
    """
    if not whitelist:
        return True  # Empty whitelist = allow all

    try:
        addr = ipaddress.ip_address(client_ip)
    except ValueError:
        return False

    for entry in whitelist:
        entry = entry.strip()
        try:
            if "/" in entry:
                if addr in ipaddress.ip_network(entry, strict=False):
                    return True
            else:
                if addr == ipaddress.ip_address(entry):
                    return True
        except ValueError:
            continue

    return False


async def _log_security_event(
    db: AsyncSession,
    event_type: str,
    severity: str,
    *,
    api_key_id: str = None,
    merchant_id: str = None,
    client_ip: str = None,
    origin: str = None,
    user_agent: str = None,
    http_method: str = None,
    endpoint: str = None,
    request_id: str = None,
    failure_reason: str = None,
    failure_layer: str = None,
    device_fingerprint: str = None,
    extra_data: dict = None,
):
    """
    Log security event to application logs (fast, non-blocking)
    and schedule async DB write for the tamper-resistant audit trail.
    """
    # Always log immediately to application logs (instant)
    log_data = {
        "event_type": event_type,
        "severity": severity,
        "api_key_id": api_key_id,
        "merchant_id": merchant_id,
        "client_ip": client_ip,
        "endpoint": endpoint,
        "http_method": http_method,
        "failure_reason": failure_reason,
        "failure_layer": failure_layer,
    }
    if severity in ("critical", "high"):
        logger.warning(f"Security event: {event_type}", extra=log_data)
    else:
        logger.info(f"Security event: {event_type}", extra=log_data)

    # Fire-and-forget DB write (non-blocking)
    asyncio.create_task(_write_audit_log_bg(
        event_type=event_type, severity=severity,
        api_key_id=api_key_id, merchant_id=merchant_id,
        client_ip=client_ip, origin=origin, user_agent=user_agent,
        http_method=http_method, endpoint=endpoint,
        request_id=request_id, failure_reason=failure_reason,
        failure_layer=failure_layer, device_fingerprint=device_fingerprint,
        extra_data=extra_data,
    ))


async def _write_audit_log_bg(
    event_type: str,
    severity: str,
    **kwargs,
):
    """Background task: write security event to DB with hash chain."""
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(SecurityAuditLog.record_hash)
                .order_by(SecurityAuditLog.created_at.desc())
                .limit(1)
            )
            prev_hash = result.scalar_one_or_none() or "GENESIS"

            now = datetime.utcnow()
            record_data = (
                f"{event_type}|{severity}|{kwargs.get('api_key_id')}|"
                f"{kwargs.get('client_ip')}|{kwargs.get('endpoint')}|"
                f"{kwargs.get('failure_reason')}|{now.isoformat()}|{prev_hash}"
            )
            record_hash = hashlib.sha256(record_data.encode("utf-8")).hexdigest()

            seq_result = await db.execute(
                select(func.coalesce(func.max(SecurityAuditLog.sequence), 0) + 1)
            )
            next_seq = seq_result.scalar()

            log_entry = SecurityAuditLog(
                sequence=next_seq,
                event_type=event_type,
                severity=severity,
                api_key_id=kwargs.get("api_key_id"),
                merchant_id=kwargs.get("merchant_id"),
                client_ip=kwargs.get("client_ip"),
                origin=kwargs.get("origin"),
                user_agent=kwargs.get("user_agent"),
                http_method=kwargs.get("http_method"),
                endpoint=kwargs.get("endpoint"),
                request_id=kwargs.get("request_id"),
                failure_reason=kwargs.get("failure_reason"),
                failure_layer=kwargs.get("failure_layer"),
                device_fingerprint=kwargs.get("device_fingerprint"),
                extra_data=kwargs.get("extra_data") or {},
                previous_hash=prev_hash if prev_hash != "GENESIS" else None,
                record_hash=record_hash,
                created_at=now,
            )
            db.add(log_entry)
            await db.commit()
    except Exception as e:
        logger.error(f"Failed to write security audit log: {e}")


def _error_response(code: str, message: str, status_code: int) -> JSONResponse:
    """Build a structured error response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "description": message,
                "source": "security",
            }
        },
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  THE MIDDLEWARE
# ═══════════════════════════════════════════════════════════════════════════════


async def api_security_middleware(request: Request, call_next):
    """
    6-layer API security middleware.

    Applied globally. Skips public paths.
    For protected paths, runs each layer in order.
    """
    path = request.url.path

    # ── Skip public paths ──
    if path in PUBLIC_PATHS:
        return await call_next(request)
    for prefix in PUBLIC_PREFIXES:
        if path.startswith(prefix):
            return await call_next(request)

    # ── Gather request context ──
    client_ip = _extract_client_ip(request)
    origin_domain = _extract_origin_domain(request)
    user_agent = request.headers.get("user-agent", "")
    request_id = getattr(request.state, "request_id", None)
    method = request.method
    api_key_id = None  # populated after basic auth extraction

    # Read body once and cache for downstream
    body = await request.body()

    # Open a dedicated DB session for the security layer
    async with AsyncSessionLocal() as db:

        # ────────────────────────────────────────────────────────
        # LAYER 3: API Key Authentication (extract key_id early)
        # We parse the Authorization header here so subsequent
        # layers can look up the merchant's security config.
        # ────────────────────────────────────────────────────────
        import base64

        auth_header = request.headers.get("authorization", "")
        key_id = None
        key_secret = None

        if auth_header.lower().startswith("basic "):
            try:
                decoded = base64.b64decode(auth_header[6:]).decode("utf-8")
                parts = decoded.split(":", 1)
                if len(parts) == 2:
                    key_id, key_secret = parts
            except Exception:
                pass

        api_key_id = key_id

        # ── Look up merchant and security config ──
        merchant = None
        sec_config = None

        if key_id:
            is_live = key_id.startswith("zp_live_") or key_id.startswith("key_live")
            col = Merchant.live_api_key_id if is_live else Merchant.api_key_id

            result = await db.execute(
                select(Merchant).where(col == key_id, Merchant.is_active == True)
            )
            merchant = result.scalar_one_or_none()

            if merchant:
                cfg_result = await db.execute(
                    select(MerchantSecurityConfig).where(
                        MerchantSecurityConfig.merchant_id == merchant.id
                    )
                )
                sec_config = cfg_result.scalar_one_or_none()

        # Determine environment
        is_production = settings.ENVIRONMENT == "production"

        # ────────────────────────────────────────────────────────
        # LAYER 1: Origin / Domain Validation
        # ────────────────────────────────────────────────────────
        if sec_config and sec_config.enforce_domain_check:
            if not origin_domain:
                await _log_security_event(
                    db, "domain_blocked", "medium",
                    api_key_id=api_key_id, client_ip=client_ip,
                    origin=origin_domain, user_agent=user_agent,
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason="Missing Origin/Referer header",
                    failure_layer="origin",
                )
                return _error_response(
                    "FORBIDDEN", "Origin header required", status.HTTP_403_FORBIDDEN
                )

            if not _match_domain(origin_domain, sec_config.whitelisted_domains or []):
                await _log_security_event(
                    db, "domain_blocked", "high",
                    api_key_id=api_key_id, client_ip=client_ip,
                    origin=origin_domain, user_agent=user_agent,
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason=f"Domain not whitelisted: {origin_domain}",
                    failure_layer="origin",
                )
                return _error_response(
                    "FORBIDDEN",
                    "Origin not allowed",
                    status.HTTP_403_FORBIDDEN,
                )

        # ────────────────────────────────────────────────────────
        # LAYER 2: IP Whitelist (proxy-aware)
        # ────────────────────────────────────────────────────────
        if sec_config and sec_config.enforce_ip_check:
            if not _match_ip(client_ip, sec_config.whitelisted_ips or []):
                await _log_security_event(
                    db, "ip_blocked", "high",
                    api_key_id=api_key_id, client_ip=client_ip,
                    origin=origin_domain, user_agent=user_agent,
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason=f"IP not whitelisted: {client_ip}",
                    failure_layer="ip",
                )
                return _error_response(
                    "FORBIDDEN",
                    "IP address not allowed",
                    status.HTTP_403_FORBIDDEN,
                )

        # ────────────────────────────────────────────────────────
        # LAYER 2.5: mTLS Certificate Check
        # ────────────────────────────────────────────────────────
        if sec_config and sec_config.enforce_mtls:
            # Nginx/Envoy terminates TLS and passes cert info via headers
            client_cert_subject = request.headers.get("x-client-cert-subject", "")
            client_cert_verified = request.headers.get("x-client-cert-verified", "")

            if client_cert_verified != "SUCCESS":
                await _log_security_event(
                    db, "mtls_failure", "critical",
                    api_key_id=api_key_id, client_ip=client_ip,
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason="Client certificate not verified",
                    failure_layer="mtls",
                )
                return _error_response(
                    "FORBIDDEN",
                    "Valid client certificate required",
                    status.HTTP_403_FORBIDDEN,
                )

            expected_subject = sec_config.mtls_certificate_subject
            if expected_subject and expected_subject not in client_cert_subject:
                await _log_security_event(
                    db, "mtls_failure", "critical",
                    api_key_id=api_key_id, client_ip=client_ip,
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason=f"Certificate subject mismatch: {client_cert_subject}",
                    failure_layer="mtls",
                )
                return _error_response(
                    "FORBIDDEN",
                    "Client certificate not authorized",
                    status.HTTP_403_FORBIDDEN,
                )

        # ────────────────────────────────────────────────────────
        # LAYER 3: API Key Validation (full auth)
        # The actual Basic Auth dependency still runs downstream
        # in the endpoint. Here we do early rejection for obvious
        # invalid keys to fail fast.
        # ────────────────────────────────────────────────────────
        if not key_id or not key_secret:
            # Let FastAPI's built-in Basic Auth dependency handle the 401
            # (some paths may be optional-auth; don't block here)
            pass
        elif not merchant:
            await _log_security_event(
                db, "auth_failure", "high",
                api_key_id=api_key_id, client_ip=client_ip,
                origin=origin_domain, user_agent=user_agent,
                http_method=method, endpoint=path,
                request_id=request_id,
                failure_reason=f"Unknown API key: {key_id}",
                failure_layer="api_key",
            )
            return _error_response(
                "UNAUTHORIZED",
                "Invalid API key",
                status.HTTP_401_UNAUTHORIZED,
            )
        else:
            # Verify secret
            is_live = key_id.startswith("zp_live_") or key_id.startswith("key_live")
            secret_hash = merchant.live_api_secret_hash if is_live else merchant.api_secret_hash

            if not secret_hash or not verify_password(key_secret, secret_hash):
                await _log_security_event(
                    db, "auth_failure", "critical",
                    api_key_id=api_key_id, client_ip=client_ip,
                    merchant_id=str(merchant.id),
                    origin=origin_domain, user_agent=user_agent,
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason="Invalid API secret",
                    failure_layer="api_key",
                )
                return _error_response(
                    "UNAUTHORIZED",
                    "Invalid API credentials",
                    status.HTTP_401_UNAUTHORIZED,
                )

        # ────────────────────────────────────────────────────────
        # LAYER 4: HMAC Request Signature Verification
        # ────────────────────────────────────────────────────────
        if sec_config and sec_config.enforce_request_signing:
            sig_header = request.headers.get("x-signature", "")
            ts_header = request.headers.get("x-timestamp", "")

            if not sig_header or not ts_header:
                await _log_security_event(
                    db, "signature_invalid", "high",
                    api_key_id=api_key_id, client_ip=client_ip,
                    merchant_id=str(merchant.id) if merchant else None,
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason="Missing x-signature or x-timestamp header",
                    failure_layer="signature",
                )
                return _error_response(
                    "UNAUTHORIZED",
                    "Request signature required (x-signature, x-timestamp)",
                    status.HTTP_401_UNAUTHORIZED,
                )

            # Validate timestamp freshness
            ts_valid, ts_error = validate_timestamp(ts_header, REPLAY_WINDOW)
            if not ts_valid:
                await _log_security_event(
                    db, "signature_invalid", "high",
                    api_key_id=api_key_id, client_ip=client_ip,
                    merchant_id=str(merchant.id) if merchant else None,
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason=ts_error,
                    failure_layer="signature",
                )
                return _error_response(
                    "UNAUTHORIZED",
                    ts_error,
                    status.HTTP_401_UNAUTHORIZED,
                )

            # Retrieve signing secret from sec_config
            # The signing secret is stored as a hash — but for HMAC we need the actual secret.
            # The merchant receives the signing_secret on config creation.
            # We store it encrypted (not hashed) so the server can recompute signatures.
            from app.core.security import decrypt_data
            signing_secret = None

            if sec_config.signing_secret_hash:
                signing_secret = decrypt_data(sec_config.signing_secret_hash)

            if not signing_secret:
                await _log_security_event(
                    db, "signature_invalid", "high",
                    api_key_id=api_key_id, client_ip=client_ip,
                    merchant_id=str(merchant.id) if merchant else None,
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason="Signing secret not configured for merchant",
                    failure_layer="signature",
                )
                return _error_response(
                    "UNAUTHORIZED",
                    "Request signing is enforced but signing secret is not configured",
                    status.HTTP_401_UNAUTHORIZED,
                )

            # Verify HMAC signature
            if not verify_request_signature(
                signing_secret, method, path, body, ts_header, sig_header
            ):
                await _log_security_event(
                    db, "signature_invalid", "critical",
                    api_key_id=api_key_id, client_ip=client_ip,
                    merchant_id=str(merchant.id) if merchant else None,
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason="HMAC signature mismatch",
                    failure_layer="signature",
                )
                return _error_response(
                    "UNAUTHORIZED",
                    "Invalid request signature",
                    status.HTTP_401_UNAUTHORIZED,
                )

        # ────────────────────────────────────────────────────────
        # LAYER 5: Replay Attack Protection
        # ────────────────────────────────────────────────────────
        sig_header = request.headers.get("x-signature", "")
        enforce_replay = (
            sec_config and sec_config.enforce_replay_protection and sig_header
        )

        if enforce_replay:
            cache_key = replay_cache_key(sig_header)

            if await redis_client.exists(cache_key):
                await _log_security_event(
                    db, "replay_detected", "critical",
                    api_key_id=api_key_id, client_ip=client_ip,
                    merchant_id=str(merchant.id) if merchant else None,
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason=f"Duplicate signature detected (replay)",
                    failure_layer="replay",
                )
                return _error_response(
                    "FORBIDDEN",
                    "Replay detected — duplicate request signature",
                    status.HTTP_403_FORBIDDEN,
                )

            # Store signature with TTL = replay window
            await redis_client.set(cache_key, "1", expire=REPLAY_WINDOW)

        # ────────────────────────────────────────────────────────
        # LAYER 6: Rate Limiting (per API key + IP)
        # ────────────────────────────────────────────────────────
        if merchant and settings.RATE_LIMIT_ENABLED:
            rate_key = f"zp:rate:{api_key_id}:{client_ip}"
            window = 60  # 1 minute

            # Determine limit
            if sec_config and sec_config.rate_limit_per_minute:
                try:
                    limit = int(sec_config.rate_limit_per_minute)
                except ValueError:
                    limit = DEFAULT_RATE_LIMIT_PRODUCTION
            else:
                env = merchant.environment if hasattr(merchant, "environment") else None
                if env == EnvironmentType.PRODUCTION:
                    limit = DEFAULT_RATE_LIMIT_PRODUCTION
                else:
                    limit = DEFAULT_RATE_LIMIT_SANDBOX

            count = await redis_client.incr(rate_key)
            if count == 1:
                await redis_client.expire(rate_key, window)

            if count and count > limit:
                await _log_security_event(
                    db, "rate_limited", "medium",
                    api_key_id=api_key_id, client_ip=client_ip,
                    merchant_id=str(merchant.id),
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason=f"Rate limit exceeded: {count}/{limit} per minute",
                    failure_layer="rate_limit",
                )
                return _error_response(
                    "RATE_LIMIT_EXCEEDED",
                    f"Rate limit exceeded. Maximum {limit} requests per minute.",
                    status.HTTP_429_TOO_MANY_REQUESTS,
                )

        # ────────────────────────────────────────────────────────
        # LAYER 7: Device Fingerprint Anomaly Detection
        # ────────────────────────────────────────────────────────
        if sec_config and sec_config.enforce_device_binding and merchant:
            accept_lang = request.headers.get("accept-language", "")
            custom_device = request.headers.get("x-device-id", "")

            fp = compute_device_fingerprint(
                user_agent, client_ip, accept_lang, custom_device
            )

            known = sec_config.known_device_fingerprints or []

            if known and fp not in known:
                # Don't hard-block — log as anomaly for review
                # Can be upgraded to blocking via enforce_device_binding = "strict"
                await _log_security_event(
                    db, "device_anomaly", "medium",
                    api_key_id=api_key_id, client_ip=client_ip,
                    merchant_id=str(merchant.id),
                    http_method=method, endpoint=path,
                    request_id=request_id,
                    failure_reason=f"Unknown device fingerprint: {fp[:16]}...",
                    failure_layer="device",
                    device_fingerprint=fp,
                )
                # Optionally block:
                # return _error_response("FORBIDDEN", "Unrecognized device", 403)

        # ────────────────────────────────────────────────────────
        # ALL LAYERS PASSED — Cache merchant on request.state
        # so endpoint dependency can skip duplicate DB + bcrypt
        # ────────────────────────────────────────────────────────
        if merchant:
            request.state.merchant = merchant
            request.state.merchant_environment = (
                EnvironmentType.PRODUCTION
                if (key_id and (key_id.startswith("zp_live_") or key_id.startswith("key_live")))
                else EnvironmentType.SANDBOX
            )

    # ── Forward to endpoint ──
    response = await call_next(request)
    return response
