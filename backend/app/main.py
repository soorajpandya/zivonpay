"""
FastAPI Main Application
Entry point for ZivonPay Backend API
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import time
import uuid

from app.config import settings
from app.database import init_db, close_db
from app.redis_client import redis_client
from app.core.logging import setup_logging
from app.core.exceptions import ZivonPayException
from app.api.v1 import api_router

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info(f"Starting ZivonPay API - Environment: {settings.ENVIRONMENT}")
    
    # Initialize database
    try:
        await init_db()
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    
    # Pre-warm connection pool (open connections ahead of first request)
    try:
        from app.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection pool pre-warmed")
    except Exception as e:
        logger.warning(f"Pool pre-warm failed (non-fatal): {e}")
    
    # Connect to Redis
    try:
        await redis_client.connect()
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
    
    logger.info("ZivonPay API started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down ZivonPay API")
    await redis_client.disconnect()
    await close_db()
    logger.info("ZivonPay API shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-grade Payment Aggregator Platform",
    openapi_url="/openapi.json" if settings.ENVIRONMENT == "sandbox" or settings.DEBUG else None,
    docs_url="/docs" if settings.ENVIRONMENT == "sandbox" or settings.DEBUG else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "sandbox" or settings.DEBUG else None,
    lifespan=lifespan
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# IP Whitelist Middleware (production only)
@app.middleware("http")
async def ip_whitelist(request: Request, call_next):
    """Allow only whitelisted IPs (skipped in sandbox)"""
    # Skip IP whitelist in sandbox/development
    if settings.ENVIRONMENT != "production":
        return await call_next(request)
    
    # Skip IP whitelist if no IPs configured (empty list means allow all)
    if not settings.ALLOWED_IPS or settings.ALLOWED_IPS == [""]:
        return await call_next(request)
    
    client_ip = request.client.host if request.client else None
    
    if client_ip not in settings.ALLOWED_IPS:
        logger.warning(
            f"Blocked request from unauthorized IP",
            extra={
                "client_ip": client_ip,
                "path": request.url.path,
            }
        )
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "error": "forbidden",
                "message": "Access denied: IP not whitelisted"
            }
        )
    
    return await call_next(request)


# Trusted Host Middleware (Security)
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["api.zivonpay.com", "*.zivonpay.com"]
    )


# Request ID Middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add unique request ID to each request"""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing"""
    start_time = time.time()
    
    # Log request
    logger.info(
        f"Request started",
        extra={
            "request_id": getattr(request.state, "request_id", None),
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None,
        }
    )
    
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Log response
    logger.info(
        f"Request completed",
        extra={
            "request_id": getattr(request.state, "request_id", None),
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
        }
    )
    
    # Add timing header
    response.headers["X-Process-Time"] = str(duration)
    
    return response


# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    # Relax CSP for hosted payment pages (inline styles/scripts required)
    path = request.url.path
    if path.startswith("/link/") or path.startswith("/developer-docs"):
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; "
            "img-src 'self' data:; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "connect-src 'self'"
        )
    elif path in ("/docs", "/redoc", "/openapi.json"):
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https://fastapi.tiangolo.com; "
            "font-src 'self' https://cdn.jsdelivr.net; "
            "connect-src 'self' https://cdn.jsdelivr.net"
        )
    else:
        response.headers["Content-Security-Policy"] = "default-src 'self'"
    
    return response


# Global Exception Handler
@app.exception_handler(ZivonPayException)
async def zivonpay_exception_handler(request: Request, exc: ZivonPayException):
    """Handle ZivonPay custom exceptions"""
    logger.error(
        f"ZivonPay Exception: {exc.error_code}",
        extra={
            "request_id": getattr(request.state, "request_id", None),
            "error_code": exc.error_code,
            "description": exc.description,
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.exception(
        f"Unhandled exception: {str(exc)}",
        extra={
            "request_id": getattr(request.state, "request_id", None),
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "description": "An unexpected error occurred",
                "source": "internal",
                "step": "request_processing",
            }
        }
    )


# Health Check Endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.APP_VERSION,
    }


# Root Endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {"message": "Welcome to ZivonPay API"}


# Include API routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Mount public payment link page outside /v1 prefix
from app.api.v1.endpoints.payment_link import router as payment_link_router
app.include_router(payment_link_router, prefix="/link", tags=["Payment Link"])

# Mount developer documentation (always available)
from app.api.v1.endpoints.developer_docs import router as docs_router
app.include_router(docs_router, prefix="/developer-docs", tags=["Developer Docs"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
