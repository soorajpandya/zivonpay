"""
Payment Intent Service — business logic for the Payment Link flow.
Completely independent of the QR / Order flow.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from uuid import UUID
import secrets
import logging

from app.models.merchant import Merchant
from app.models.payment_intent import PaymentIntent, PaymentIntentStatus
from app.schemas.payment_intent import (
    PaymentIntentCreate,
    PaymentIntentResponse,
    PaymentPageData,
)
from app.services.sprintnxt import sprintnxt_service
from app.services.audit import audit_service
from app.core.security import (
    encrypt_data,
    decrypt_data,
    create_access_token,
    verify_token,
)
from app.core.utils import paise_to_rupees, get_current_datetime


def _naive_utc(dt: datetime) -> datetime:
    """Strip tzinfo so comparisons with naive-UTC datetimes don't raise."""
    return dt.replace(tzinfo=None) if dt and dt.tzinfo else dt


from app.core.exceptions import (
    ValidationError,
    ResourceNotFoundError,
    UpstreamServiceError,
    DuplicateOrderError,
)
from app.config import get_base_url

logger = logging.getLogger(__name__)


def _generate_short_id() -> str:
    """Generate a URL-friendly short ID like  pi_a3f8c2d901e4."""
    return f"pi_{secrets.token_hex(8)}"


class PaymentIntentService:
    """Service for payment-intent (link) operations"""

    # ── create ─────────────────────────────────────────────────────────────

    @staticmethod
    async def create_intent(
        merchant: Merchant,
        data: PaymentIntentCreate,
        db: AsyncSession,
    ) -> PaymentIntent:
        """
        Create a new payment intent and return a signed payment link.

        Rejects duplicate order_ids with 409 Conflict.
        """

        # Reject duplicate order_id for this merchant
        existing = await PaymentIntentService._get_by_order_id(
            merchant.id, data.order_id, db
        )
        if existing:
            raise DuplicateOrderError(data.order_id, existing.status.value)

        short_id = _generate_short_id()
        expiry_minutes = data.expiry_minutes or 15
        expires_at = get_current_datetime() + timedelta(minutes=expiry_minutes)

        # Signed JWT token embedded in the payment link
        link_token = create_access_token(
            data={"sub": short_id, "mid": str(merchant.id), "type": "payment_link"},
            expires_delta=timedelta(minutes=expiry_minutes),
        )

        intent = PaymentIntent(
            merchant_id=merchant.id,
            short_id=short_id,
            amount=data.amount,
            currency=data.currency,
            order_id=data.order_id,
            customer_name=encrypt_data(data.customer_name),
            customer_email=encrypt_data(data.customer_email) if data.customer_email else None,
            customer_phone=encrypt_data(data.customer_phone),
            link_token=link_token,
            notes=data.notes or {},
            expires_at=expires_at,
            status=PaymentIntentStatus.CREATED,
        )

        db.add(intent)
        await db.commit()
        await db.refresh(intent)

        logger.info(
            "Payment intent created",
            extra={
                "short_id": short_id,
                "merchant_id": str(merchant.id),
                "amount": data.amount,
                "order_id": data.order_id,
            },
        )

        # Audit
        try:
            await audit_service.create_audit_log(
                db=db,
                action="payment_intent.create",
                merchant_id=merchant.id,
                entity_type="payment_intent",
                entity_id=intent.id,
                changes={
                    "amount": data.amount,
                    "order_id": data.order_id,
                    "status": intent.status.value,
                },
            )
        except Exception:
            logger.warning("Audit log write failed for payment_intent.create", exc_info=True)

        return intent

    # ── initiate payment (called when customer opens link) ─────────────────

    @staticmethod
    async def initiate_payment(
        intent: PaymentIntent,
        db: AsyncSession,
    ) -> PaymentIntent:
        """
        Call SprintNXT to generate UPI intent for the payment link.
        Transitions status  created → pending.
        """
        if intent.upi_intent_url:
            # Already initiated — return as-is
            return intent

        if intent.status not in (PaymentIntentStatus.CREATED,):
            return intent

        amount_rupees = paise_to_rupees(intent.amount)
        # Unique per attempt — SprintNXT rejects duplicate txnReferance
        txn_ref = intent.short_id.replace("pi_", "")[:12] + secrets.token_hex(2)

        customer_phone = decrypt_data(intent.customer_phone) if intent.customer_phone else "9999999999"
        customer_name = decrypt_data(intent.customer_name) if intent.customer_name else "Customer"

        notes = intent.notes or {}
        notes_lower = {k.lower(): v for k, v in notes.items()}
        txn_note = notes_lower.get("description", "Payment")

        upi_response = await sprintnxt_service.create_upi_intent(
            amount=amount_rupees,
            mobile=customer_phone,
            customer_name=customer_name,
            transaction_reference=txn_ref,
            transaction_note=txn_note,
            expiry_time=max(
                1,
                int((_naive_utc(intent.expires_at) - get_current_datetime()).total_seconds() // 60),
            ),
            ref_url="https://zivonpay.com",
        )

        intent.upstream_reference = upi_response["upi_ref_id"]
        intent.upstream_merchant_id = upi_response.get("merchant_id")
        intent.upi_intent_url = upi_response.get("intent_url")
        intent.status = PaymentIntentStatus.PENDING

        await db.commit()
        await db.refresh(intent)

        logger.info(
            "Payment intent UPI initiated",
            extra={
                "short_id": intent.short_id,
                "upstream_reference": intent.upstream_reference,
            },
        )

        return intent

    # ── fetch / list ───────────────────────────────────────────────────────

    @staticmethod
    async def get_intent(
        merchant: Merchant,
        short_id: str,
        db: AsyncSession,
    ) -> PaymentIntent:
        stmt = select(PaymentIntent).where(
            and_(
                PaymentIntent.short_id == short_id,
                PaymentIntent.merchant_id == merchant.id,
            )
        )
        result = await db.execute(stmt)
        intent = result.scalar_one_or_none()
        if not intent:
            raise ResourceNotFoundError("PaymentIntent", short_id)
        return intent

    @staticmethod
    async def get_intent_by_short_id(
        short_id: str,
        db: AsyncSession,
    ) -> Optional[PaymentIntent]:
        """Public lookup (no merchant scoping) — used by the payment page."""
        stmt = select(PaymentIntent).where(PaymentIntent.short_id == short_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_intents(
        merchant: Merchant,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
    ) -> List[PaymentIntent]:
        stmt = (
            select(PaymentIntent)
            .where(PaymentIntent.merchant_id == merchant.id)
            .order_by(PaymentIntent.created_at.desc())
            .offset(skip)
            .limit(min(limit, 100))
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    # ── status updates (webhook) ───────────────────────────────────────────

    @staticmethod
    async def mark_success(
        intent: PaymentIntent,
        payer_vpa: Optional[str],
        rrn: Optional[str],
        bank_name: Optional[str],
        db: AsyncSession,
    ) -> PaymentIntent:
        """Mark intent as successfully paid."""
        if intent.status == PaymentIntentStatus.SUCCESS:
            return intent  # already recorded

        old_status = intent.status.value
        intent.status = PaymentIntentStatus.SUCCESS
        intent.paid_at = get_current_datetime()
        intent.payer_vpa = encrypt_data(payer_vpa) if payer_vpa else None
        intent.rrn = rrn
        intent.bank_name = bank_name

        await db.commit()
        await db.refresh(intent)

        logger.info(
            "Payment intent marked SUCCESS",
            extra={"short_id": intent.short_id, "rrn": rrn},
        )

        try:
            await audit_service.create_audit_log(
                db=db,
                action="payment_intent.success",
                merchant_id=intent.merchant_id,
                entity_type="payment_intent",
                entity_id=intent.id,
                changes={"status": {"old": old_status, "new": "success"}, "rrn": rrn},
            )
        except Exception:
            logger.warning("Audit log write failed for payment_intent.success", exc_info=True)

        return intent

    @staticmethod
    async def mark_failed(
        intent: PaymentIntent,
        error_code: Optional[str],
        error_description: Optional[str],
        db: AsyncSession,
    ) -> PaymentIntent:
        if intent.status in (PaymentIntentStatus.SUCCESS,):
            return intent  # can't override success

        old_status = intent.status.value
        intent.status = PaymentIntentStatus.FAILED
        intent.error_code = error_code
        intent.error_description = error_description

        await db.commit()
        await db.refresh(intent)

        logger.info(
            "Payment intent marked FAILED",
            extra={"short_id": intent.short_id, "error_code": error_code},
        )

        try:
            await audit_service.create_audit_log(
                db=db,
                action="payment_intent.failed",
                merchant_id=intent.merchant_id,
                entity_type="payment_intent",
                entity_id=intent.id,
                changes={"status": {"old": old_status, "new": "failed"}, "error_code": error_code},
            )
        except Exception:
            logger.warning("Audit log write failed for payment_intent.failed", exc_info=True)

        return intent

    @staticmethod
    async def expire_if_needed(
        intent: PaymentIntent,
        db: AsyncSession,
    ) -> PaymentIntent:
        """Check expiry and mark expired if past deadline."""
        if intent.status in (PaymentIntentStatus.SUCCESS, PaymentIntentStatus.EXPIRED):
            return intent
        if _naive_utc(intent.expires_at) <= get_current_datetime():
            intent.status = PaymentIntentStatus.EXPIRED
            await db.commit()
            await db.refresh(intent)
        return intent

    # ── helpers ────────────────────────────────────────────────────────────

    @staticmethod
    async def _get_by_order_id(
        merchant_id: UUID,
        order_id: str,
        db: AsyncSession,
    ) -> Optional[PaymentIntent]:
        stmt = select(PaymentIntent).where(
            and_(
                PaymentIntent.merchant_id == merchant_id,
                PaymentIntent.order_id == order_id,
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    def intent_to_response(intent: PaymentIntent) -> PaymentIntentResponse:
        base_url = get_base_url()
        payment_link = f"{base_url}/link/{intent.short_id}?token={intent.link_token}"
        return PaymentIntentResponse(
            status="success",
            payment_intent_id=intent.short_id,
            payment_link=payment_link,
            amount=intent.amount,
            currency=intent.currency,
            order_id=intent.order_id,
            intent_status=intent.status.value,
            expires_at=intent.expires_at.replace(tzinfo=timezone.utc).isoformat(),
            created_at=int(intent.created_at.timestamp()),
            paid_at=int(intent.paid_at.timestamp()) if intent.paid_at else None,
        )

    @staticmethod
    def intent_to_page_data(intent: PaymentIntent) -> PaymentPageData:
        customer_name = decrypt_data(intent.customer_name) if intent.customer_name else "Customer"
        base_url = get_base_url()
        return PaymentPageData(
            payment_intent_id=intent.short_id,
            amount=intent.amount,
            currency=intent.currency,
            order_id=intent.order_id,
            customer_name=customer_name,
            status=intent.status.value,
            expires_at=intent.expires_at.replace(tzinfo=timezone.utc).isoformat(),
            upi_intent_url=intent.upi_intent_url,
            qr_image_url=f"{base_url}/link/{intent.short_id}/qr" if intent.upi_intent_url else None,
        )


# Global service instance
payment_intent_service = PaymentIntentService()
