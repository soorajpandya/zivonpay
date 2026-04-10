"""
Orders API Endpoints
"""

from fastapi import APIRouter, Depends, status, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from uuid import UUID
import io
import qrcode

from app.database import get_db
from app.models.merchant import Merchant
from app.api.dependencies import get_current_merchant
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse
from app.services.order import order_service
from app.core.exceptions import OrderNotFoundError, ValidationError
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Order",
    description="Create a new order and generate UPI payment intent"
)
async def create_order(
    order_data: OrderCreate,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key")
):
    """
    Create a new order with UPI payment intent.
    
    **Authentication**: Required (HTTP Basic — key_id:key_secret)
    
    **Rate Limit**: 1000 requests/minute
    
    **Idempotency**: Supported via X-Idempotency-Key header
    """
    logger.info(
        f"Create order request",
        extra={
            "merchant_id": str(merchant.id),
            "receipt": order_data.receipt,
            "amount": order_data.amount
        }
    )
    
    # TODO: Implement idempotency check if key provided
    
    # Create order
    order = await order_service.create_order(merchant, order_data, db)
    
    # Convert to response
    return order_service.order_to_response(order)


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get Order",
    description="Fetch order details and check status"
)
async def get_order(
    order_id: UUID,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch order details by ID and check latest status from upstream.
    
    **Authentication**: Required (HTTP Basic — key_id:key_secret)
    
    **Rate Limit**: 5000 requests/minute
    """
    logger.info(
        f"Get order request",
        extra={
            "merchant_id": str(merchant.id),
            "order_id": str(order_id)
        }
    )
    
    # Get and check order status
    order = await order_service.check_order_status(merchant, order_id, db)
    
    # Convert to response
    return order_service.order_to_response(order)


@router.get(
    "",
    response_model=OrderListResponse,
    summary="List Orders",
    description="List all orders for the merchant"
)
async def list_orders(
    skip: int = 0,
    limit: int = 10,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """
    List orders for the authenticated merchant.
    
    **Authentication**: Required (HTTP Basic — key_id:key_secret)
    
    **Pagination**: Use skip and limit parameters
    """
    logger.info(
        f"List orders request",
        extra={
            "merchant_id": str(merchant.id),
            "skip": skip,
            "limit": limit
        }
    )
    
    # Validate pagination
    if limit > 100:
        limit = 100
    
    # Get orders
    orders = await order_service.list_orders(merchant, db, skip, limit)
    
    # Convert to response
    order_responses = [order_service.order_to_response(order) for order in orders]
    
    return OrderListResponse(
        entity="list",
        count=len(order_responses),
        data=order_responses
    )


@router.get(
    "/{order_id}/qr",
    summary="Get QR Code",
    description="Get QR code image for order payment",
    responses={200: {"content": {"image/png": {}}}}
)
async def get_order_qr(
    order_id: UUID,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """
    Get QR code PNG image for the order's UPI intent URL.
    
    **Authentication**: Required (HTTP Basic — key_id:key_secret)
    """
    order = await order_service.get_order(merchant, order_id, db)
    
    if not order.upi_intent_url:
        raise ValidationError(
            description="QR code not available for this order — UPI intent was not generated",
            field="upi_intent_url"
        )
    
    # Generate QR code image
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(order.upi_intent_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    
    return StreamingResponse(buf, media_type="image/png")
