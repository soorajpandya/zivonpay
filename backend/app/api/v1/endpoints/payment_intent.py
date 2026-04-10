"""
Payment Intent API Endpoints — merchant-facing CRUD
Mounted at  /v1/payment-intent
"""

from fastapi import APIRouter, Depends, Query, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from app.database import get_db
from app.models.merchant import Merchant
from app.api.dependencies import get_current_merchant
from app.schemas.payment_intent import (
    PaymentIntentCreate,
    PaymentIntentResponse,
    PaymentIntentListResponse,
)
from app.services.payment_intent import payment_intent_service
from app.core.exceptions import ResourceNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Create ─────────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=PaymentIntentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Payment Intent",
    description="Generate a hosted payment link for pay-in collection",
)
async def create_payment_intent(
    data: PaymentIntentCreate,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    """
    Create a new Payment Intent and receive a signed payment link.

    **Authentication**: Required (HTTP Basic — key_id:key_secret)

    **Idempotency**: Requests with the same `order_id` return the
    existing intent if it has not expired or failed.
    """
    logger.info(
        "Create payment intent request",
        extra={
            "merchant_id": str(merchant.id),
            "order_id": data.order_id,
            "amount": data.amount,
        },
    )

    intent = await payment_intent_service.create_intent(merchant, data, db)
    return payment_intent_service.intent_to_response(intent)


# ── Get by short_id ────────────────────────────────────────────────────────────

@router.get(
    "/{short_id}",
    response_model=PaymentIntentResponse,
    summary="Get Payment Intent",
    description="Fetch payment intent details and current status",
)
async def get_payment_intent(
    short_id: str,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetch a payment intent by its short ID (e.g. `pi_a1b2c3d4e5f6`).

    **Authentication**: Required (HTTP Basic — key_id:key_secret)
    """
    intent = await payment_intent_service.get_intent(merchant, short_id, db)

    # Check expiry
    intent = await payment_intent_service.expire_if_needed(intent, db)

    return payment_intent_service.intent_to_response(intent)


# ── List ────────────────────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=PaymentIntentListResponse,
    summary="List Payment Intents",
    description="List all payment intents for the authenticated merchant",
)
async def list_payment_intents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
):
    """
    Paginated listing of payment intents.

    **Authentication**: Required (HTTP Basic — key_id:key_secret)
    """
    intents = await payment_intent_service.list_intents(merchant, db, skip, limit)
    responses = [payment_intent_service.intent_to_response(i) for i in intents]
    return PaymentIntentListResponse(entity="list", count=len(responses), data=responses)
