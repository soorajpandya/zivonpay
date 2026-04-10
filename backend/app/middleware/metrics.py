"""
Prometheus Metrics for Monitoring
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import time

# Define metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

orders_created_total = Counter(
    'orders_created_total',
    'Total orders created',
    ['merchant_id', 'status']
)

payments_captured_total = Counter(
    'payments_captured_total',
    'Total payments captured',
    ['merchant_id']
)

payments_failed_total = Counter(
    'payments_failed_total',
    'Total payments failed',
    ['merchant_id']
)

upstream_requests_total = Counter(
    'upstream_requests_total',
    'Total upstream (SprintNXT) requests',
    ['endpoint', 'status']
)

upstream_request_duration_seconds = Histogram(
    'upstream_request_duration_seconds',
    'Upstream request duration in seconds',
    ['endpoint']
)

webhook_deliveries_total = Counter(
    'webhook_deliveries_total',
    'Total webhook deliveries',
    ['status']
)

active_merchants = Gauge(
    'active_merchants',
    'Number of active merchants'
)


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to collect HTTP metrics"""
    
    async def dispatch(self, request: Request, call_next):
        # Skip metrics endpoint
        if request.url.path == "/metrics":
            return await call_next(request)
        
        start_time = time.time()
        
        response = await call_next(request)
        
        duration = time.time() - start_time
        
        # Record metrics
        http_requests_total.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        
        http_request_duration_seconds.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)
        
        return response


async def metrics_endpoint():
    """Endpoint to expose Prometheus metrics"""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
