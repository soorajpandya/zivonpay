"""
Payments API Endpoints
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.merchant import Merchant
from app.api.dependencies import get_current_merchant
from app.schemas.payment import PaymentResponse, PaymentListResponse
from app.services.payment import payment_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
    summary="Get Payment",
    description="Fetch payment details by ID"
)
async def get_payment(
    payment_id: UUID,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch payment details by ID.
    
    **Authentication**: Required (HTTP Basic — key_id:key_secret)
    """
    logger.info(
        f"Get payment request",
        extra={
            "merchant_id": str(merchant.id),
            "payment_id": str(payment_id)
        }
    )
    
    payment = await payment_service.get_payment(merchant, payment_id, db)
    return payment_service.payment_to_response(payment)


@router.get(
    "",
    response_model=PaymentListResponse,
    summary="List Payments",
    description="List all payments for the merchant"
)
async def list_payments(
    skip: int = 0,
    limit: int = 10,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """
    List payments for the authenticated merchant.
    
    **Authentication**: Required (HTTP Basic — key_id:key_secret)
    
    **Pagination**: Use skip and limit parameters
    """
    logger.info(
        f"List payments request",
        extra={
            "merchant_id": str(merchant.id),
            "skip": skip,
            "limit": limit
        }
    )
    
    if limit > 100:
        limit = 100
    
    payments = await payment_service.list_payments(merchant, db, skip, limit)
    payment_responses = [payment_service.payment_to_response(p) for p in payments]
    
    return PaymentListResponse(
        entity="list",
        count=len(payment_responses),
        data=payment_responses
    )
