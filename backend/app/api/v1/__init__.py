"""
API v1 Router - Aggregates all v1 endpoints
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, orders, payments, audit, logs, payment_intent, payu, payu_intent, payu_payout

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit"])
api_router.include_router(logs.router, prefix="/logs", tags=["Logs"])
api_router.include_router(payment_intent.router, prefix="/payment-intent", tags=["Payment Intent"])
api_router.include_router(payu.router, prefix="/payu", tags=["PayU"])
api_router.include_router(payu_intent.router, prefix="/payu-intent", tags=["PayU UPI Intent"])
api_router.include_router(payu_payout.router, prefix="/payu-payout", tags=["PayU Payouts"])
