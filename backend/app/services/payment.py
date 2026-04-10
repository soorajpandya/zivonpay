"""
Payment Service - Business logic for payment operations
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from uuid import UUID
import logging

from app.models.merchant import Merchant
from app.models.payment import Payment, PaymentStatus
from app.models.order import Order
from app.schemas.payment import PaymentResponse
from app.core.security import decrypt_data
from app.core.exceptions import PaymentNotFoundError

logger = logging.getLogger(__name__)


class PaymentService:
    """Service for payment operations"""
    
    @staticmethod
    async def get_payment(
        merchant: Merchant,
        payment_id: UUID,
        db: AsyncSession
    ) -> Payment:
        """
        Get payment by ID
        
        Args:
            merchant: Merchant object
            payment_id: Payment UUID
            db: Database session
            
        Returns:
            Payment object
            
        Raises:
            PaymentNotFoundError: If payment not found
        """
        stmt = select(Payment).where(
            and_(
                Payment.id == payment_id,
                Payment.merchant_id == merchant.id
            )
        )
        result = await db.execute(stmt)
        payment = result.scalar_one_or_none()
        
        if not payment:
            raise PaymentNotFoundError(str(payment_id))
        
        return payment
    
    @staticmethod
    async def list_payments(
        merchant: Merchant,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 10
    ) -> List[Payment]:
        """
        List payments for merchant
        
        Args:
            merchant: Merchant object
            skip: Number of records to skip
            limit: Maximum number of records to return
            db: Database session
            
        Returns:
            List of Payment objects
        """
        stmt = select(Payment).where(
            Payment.merchant_id == merchant.id
        ).order_by(Payment.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(stmt)
        return list(result.scalars().all())
    
    @staticmethod
    def payment_to_response(payment: Payment) -> PaymentResponse:
        """Convert Payment model to response schema"""
        # Decrypt sensitive data
        payer_vpa = decrypt_data(payment.payer_vpa) if payment.payer_vpa else None
        
        return PaymentResponse(
            id=payment.id,
            entity="payment",
            order_id=payment.order_id,
            amount=payment.amount,
            currency=payment.currency,
            status=payment.status.value,
            payer_vpa=payer_vpa,
            rrn=payment.rrn,
            transaction_id=payment.transaction_id,
            bank_name=payment.bank_name,
            error_code=payment.error_code,
            error_description=payment.error_description,
            created_at=int(payment.created_at.timestamp()),
            captured_at=int(payment.captured_at.timestamp()) if payment.captured_at else None
        )


# Global service instance
payment_service = PaymentService()
