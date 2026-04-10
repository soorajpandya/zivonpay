"""
Order Service - Business logic for order operations
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List
from datetime import datetime, timedelta
from uuid import UUID
import logging

from app.models.merchant import Merchant
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.order import OrderCreate, OrderResponse
from app.services.sprintnxt import sprintnxt_service
from app.core.security import encrypt_data, decrypt_data
from app.core.utils import (
    get_current_timestamp,
    get_current_datetime,
    paise_to_rupees
)
from app.core.exceptions import (
    OrderNotFoundError,
    OrderAlreadyPaidError,
    ValidationError
)
from app.services.audit import audit_service

logger = logging.getLogger(__name__)


class OrderService:
    """Service for order operations"""
    
    @staticmethod
    async def create_order(
        merchant: Merchant,
        order_data: OrderCreate,
        db: AsyncSession
    ) -> Order:
        """
        Create new order and generate UPI intent
        
        Args:
            merchant: Merchant object
            order_data: Order creation data
            db: Database session
            
        Returns:
            Created Order object
        """
        # Check for duplicate receipt
        existing_order = await OrderService.get_order_by_receipt(
            merchant.id,
            order_data.receipt,
            db
        )
        
        if existing_order:
            logger.warning(
                f"Duplicate receipt attempt",
                extra={
                    "merchant_id": str(merchant.id),
                    "receipt": order_data.receipt
                }
            )
            raise ValidationError(
                f"Order with receipt '{order_data.receipt}' already exists",
                field="receipt"
            )
        
        # Create order in database
        order = Order(
            merchant_id=merchant.id,
            receipt=order_data.receipt,
            amount=order_data.amount,
            currency=order_data.currency,
            customer_name=encrypt_data(order_data.customer.name),
            customer_mobile=encrypt_data(order_data.customer.mobile),
            customer_email=encrypt_data(order_data.customer.email) if order_data.customer.email else None,
            notes=order_data.notes,
            status=OrderStatus.CREATED,
            expires_at=get_current_datetime() + timedelta(minutes=15)  # 15 min expiry
        )
        
        db.add(order)
        await db.flush()  # Get order ID
        
        logger.info(
            f"Order created",
            extra={
                "order_id": str(order.id),
                "merchant_id": str(merchant.id),
                "amount": order.amount
            }
        )
        
        # Call SprintNXT to generate UPI intent
        amount_in_rupees = paise_to_rupees(order.amount)
        
        # Use order UUID as transaction reference (SprintNXT requires >= 10 chars)
        txn_ref = str(order.id).replace("-", "")  # 32 hex chars
        
        # Case-insensitive lookup for description in notes
        notes = order_data.notes or {}
        notes_lower = {k.lower(): v for k, v in notes.items()}
        txn_note = notes_lower.get("description", "Payment")
        
        try:
            upi_response = await sprintnxt_service.create_upi_intent(
                amount=amount_in_rupees,
                mobile=order_data.customer.mobile,
                customer_name=order_data.customer.name,
                transaction_reference=txn_ref,
                transaction_note=txn_note,
                expiry_time=10
            )
            
            # Update order with UPI details
            order.upstream_reference = upi_response["upi_ref_id"]
            order.upstream_merchant_id = upi_response.get("merchant_id")
            order.upi_intent_url = upi_response.get("intent_url")
            order.qr_code_url = f"/v1/orders/{order.id}/qr"
            order.status = OrderStatus.QR_GENERATED
            
            logger.info(
                f"UPI intent generated",
                extra={
                    "order_id": str(order.id),
                    "upstream_reference": order.upstream_reference
                }
            )
        
        except Exception as e:
            logger.error(
                f"Failed to generate UPI intent",
                extra={
                    "order_id": str(order.id),
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            )
            # Rollback the order — don't save an order without UPI intent
            await db.rollback()
            raise
        
        await db.commit()
        await db.refresh(order)
        
        # Audit trail
        try:
            await audit_service.create_audit_log(
                db=db,
                action="order.create",
                merchant_id=merchant.id,
                entity_type="order",
                entity_id=order.id,
                changes={
                    "status": {"old": None, "new": order.status.value},
                    "amount": order.amount,
                    "receipt": order.receipt,
                },
            )
        except Exception:
            logger.warning("Failed to write audit log for order.create", exc_info=True)
        
        return order
    
    @staticmethod
    async def get_order(
        merchant: Merchant,
        order_id: UUID,
        db: AsyncSession
    ) -> Order:
        """
        Get order by ID
        
        Args:
            merchant: Merchant object
            order_id: Order UUID
            db: Database session
            
        Returns:
            Order object
            
        Raises:
            OrderNotFoundError: If order not found
        """
        stmt = select(Order).where(
            and_(
                Order.id == order_id,
                Order.merchant_id == merchant.id
            )
        )
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()
        
        if not order:
            raise OrderNotFoundError(str(order_id))
        
        return order
    
    @staticmethod
    async def get_order_by_receipt(
        merchant_id: UUID,
        receipt: str,
        db: AsyncSession
    ) -> Optional[Order]:
        """Get order by receipt"""
        stmt = select(Order).where(
            and_(
                Order.merchant_id == merchant_id,
                Order.receipt == receipt
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def list_orders(
        merchant: Merchant,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 10
    ) -> List[Order]:
        """
        List orders for merchant
        
        Args:
            merchant: Merchant object
            skip: Number of records to skip
            limit: Maximum number of records to return
            db: Database session
            
        Returns:
            List of Order objects
        """
        stmt = select(Order).where(
            Order.merchant_id == merchant.id
        ).order_by(Order.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(stmt)
        return list(result.scalars().all())
    
    @staticmethod
    async def check_order_status(
        merchant: Merchant,
        order_id: UUID,
        db: AsyncSession
    ) -> Order:
        """
        Check and update order status from upstream
        
        Args:
            merchant: Merchant object
            order_id: Order UUID
            db: Database session
            
        Returns:
            Updated Order object
        """
        order = await OrderService.get_order(merchant, order_id, db)
        
        # If already paid, return
        if order.status == OrderStatus.PAID:
            return order
        
        # Check upstream status if we have reference
        if order.upstream_reference:
            try:
                status_response = await sprintnxt_service.check_transaction_status(
                    transaction_id=order.receipt
                )
                
                # Map upstream status to our status
                await OrderService._update_order_from_upstream(
                    order,
                    status_response,
                    db
                )
            
            except Exception as e:
                logger.error(
                    f"Failed to check upstream status",
                    extra={
                        "order_id": str(order.id),
                        "error": str(e)
                    }
                )
        
        return order
    
    @staticmethod
    async def _update_order_from_upstream(
        order: Order,
        upstream_response: dict,
        db: AsyncSession
    ):
        """Update order status based on upstream response"""
        # Parse upstream status
        # Note: This mapping depends on SprintNXT's actual response format
        status_value = upstream_response.get("statusvalue")
        old_status = order.status.value
        
        if status_value == 3:  # QR Generated
            order.status = OrderStatus.QR_GENERATED
        elif status_value == 1:  # Success
            if order.status != OrderStatus.PAID:
                order.status = OrderStatus.PAID
                order.paid_at = get_current_datetime()
                
                # Create payment record
                await OrderService._create_payment_from_success(
                    order,
                    upstream_response,
                    db
                )
        elif status_value in [0, 2]:  # Failed
            order.status = OrderStatus.FAILED
        
        await db.commit()
        
        # Audit trail for status change
        if order.status.value != old_status:
            try:
                await audit_service.create_audit_log(
                    db=db,
                    action="order.status_change",
                    merchant_id=order.merchant_id,
                    entity_type="order",
                    entity_id=order.id,
                    changes={
                        "status": {"old": old_status, "new": order.status.value},
                    },
                )
            except Exception:
                logger.warning("Failed to write audit log for order.status_change", exc_info=True)
    
    @staticmethod
    async def _create_payment_from_success(
        order: Order,
        upstream_response: dict,
        db: AsyncSession
    ):
        """Create payment record from successful transaction"""
        payment = Payment(
            order_id=order.id,
            merchant_id=order.merchant_id,
            amount=order.amount,
            currency=order.currency,
            status=PaymentStatus.CAPTURED,
            payer_vpa=encrypt_data(upstream_response.get("payer_vpa", "")),
            rrn=upstream_response.get("rrn"),
            transaction_id=upstream_response.get("transaction_id"),
            bank_name=upstream_response.get("bank_name"),
            captured_at=get_current_datetime()
        )
        
        db.add(payment)
        
        logger.info(
            f"Payment created from upstream success",
            extra={
                "order_id": str(order.id),
                "payment_id": str(payment.id)
            }
        )
        
        # Audit trail for payment capture
        try:
            await audit_service.create_audit_log(
                db=db,
                action="payment.captured",
                merchant_id=order.merchant_id,
                entity_type="payment",
                entity_id=payment.id,
                changes={
                    "order_id": str(order.id),
                    "amount": order.amount,
                    "status": "captured",
                    "rrn": upstream_response.get("rrn"),
                },
            )
        except Exception:
            logger.warning("Failed to write audit log for payment.captured", exc_info=True)
    
    @staticmethod
    def order_to_response(order: Order) -> OrderResponse:
        """Convert Order model to response schema"""
        return OrderResponse(
            id=order.id,
            entity="order",
            amount=order.amount,
            currency=order.currency,
            status=order.status.value,
            receipt=order.receipt,
            upi_intent_url=order.upi_intent_url,
            qr_code_url=order.qr_code_url,
            notes=order.notes or {},
            created_at=int(order.created_at.timestamp()),
            expires_at=int(order.expires_at.timestamp()) if order.expires_at else None,
            paid_at=int(order.paid_at.timestamp()) if order.paid_at else None
        )


# Global service instance
order_service = OrderService()
