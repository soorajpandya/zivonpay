"""
Webhook Service - Handles webhook delivery and retries
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import httpx
import json
import logging
from typing import Dict, Any, Optional
from uuid import UUID

from app.models.merchant import Merchant
from app.models.webhook import Webhook, WebhookEventType, WebhookStatus
from app.core.security import create_webhook_signature, decrypt_data
from app.core.utils import get_current_timestamp, get_current_datetime
from app.config import settings

logger = logging.getLogger(__name__)


class WebhookService:
    """Service for webhook operations"""
    
    @staticmethod
    async def create_webhook(
        merchant: Merchant,
        event_type: WebhookEventType,
        entity_id: UUID,
        payload: Dict[str, Any],
        db: AsyncSession
    ) -> Optional[Webhook]:
        """
        Create and queue webhook for delivery
        
        Args:
            merchant: Merchant object
            event_type: Type of webhook event
            entity_id: ID of the entity (order/payment)
            payload: Webhook payload data
            db: Database session
            
        Returns:
            Webhook object or None if no webhook URL configured
        """
        if not merchant.webhook_url:
            logger.info(
                f"No webhook URL configured for merchant",
                extra={"merchant_id": str(merchant.id)}
            )
            return None
        
        # Create webhook record
        webhook = Webhook(
            merchant_id=merchant.id,
            event_type=event_type,
            entity_id=entity_id,
            url=merchant.webhook_url,
            payload=payload,
            status=WebhookStatus.PENDING,
            attempt_count=0,
            max_attempts=settings.WEBHOOK_RETRY_COUNT
        )
        
        db.add(webhook)
        await db.commit()
        await db.refresh(webhook)
        
        logger.info(
            f"Webhook created",
            extra={
                "webhook_id": str(webhook.id),
                "event_type": event_type.value,
                "merchant_id": str(merchant.id)
            }
        )
        
        # Attempt immediate delivery
        await WebhookService.deliver_webhook(webhook, merchant, db)
        
        return webhook
    
    @staticmethod
    async def deliver_webhook(
        webhook: Webhook,
        merchant: Merchant,
        db: AsyncSession
    ) -> bool:
        """
        Attempt to deliver webhook
        
        Args:
            webhook: Webhook object
            merchant: Merchant object
            db: Database session
            
        Returns:
            True if delivered successfully, False otherwise
        """
        if webhook.attempt_count >= webhook.max_attempts:
            webhook.status = WebhookStatus.FAILED
            webhook.failed_at = get_current_datetime()
            await db.commit()
            return False
        
        # Increment attempt count
        webhook.attempt_count += 1
        
        # Prepare payload
        payload_str = json.dumps(webhook.payload)
        timestamp = get_current_timestamp()
        
        # Create signature
        webhook_secret = decrypt_data(merchant.webhook_secret_hash) if merchant.webhook_secret_hash else ""
        signature = create_webhook_signature(payload_str, webhook_secret, timestamp) if webhook_secret else ""
        
        webhook.signature = signature
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "X-ZivonPay-Signature": signature,
            "X-ZivonPay-Timestamp": str(timestamp),
            "X-ZivonPay-Event": webhook.event_type.value
        }
        
        logger.info(
            f"Attempting webhook delivery (attempt {webhook.attempt_count}/{webhook.max_attempts})",
            extra={
                "webhook_id": str(webhook.id),
                "url": webhook.url
            }
        )
        
        try:
            async with httpx.AsyncClient(timeout=settings.WEBHOOK_TIMEOUT) as client:
                response = await client.post(
                    webhook.url,
                    content=payload_str,
                    headers=headers
                )
                
                webhook.response_status_code = response.status_code
                webhook.response_body = response.text[:1000]  # Limit response size
                
                # Check if successful (2xx status code)
                if 200 <= response.status_code < 300:
                    webhook.status = WebhookStatus.DELIVERED
                    webhook.delivered_at = get_current_datetime()
                    
                    logger.info(
                        f"Webhook delivered successfully",
                        extra={
                            "webhook_id": str(webhook.id),
                            "status_code": response.status_code
                        }
                    )
                    
                    await db.commit()
                    return True
                else:
                    logger.warning(
                        f"Webhook delivery failed with status {response.status_code}",
                        extra={
                            "webhook_id": str(webhook.id),
                            "status_code": response.status_code
                        }
                    )
        
        except Exception as e:
            logger.error(
                f"Webhook delivery exception: {str(e)}",
                extra={"webhook_id": str(webhook.id)}
            )
            webhook.response_body = str(e)[:1000]
        
        # Schedule retry if not max attempts
        if webhook.attempt_count < webhook.max_attempts:
            # Exponential backoff: 1min, 5min, 15min
            retry_delays = [60, 300, 900]
            delay_seconds = retry_delays[min(webhook.attempt_count - 1, len(retry_delays) - 1)]
            webhook.next_retry_at = get_current_datetime() + timedelta(seconds=delay_seconds)
            
            logger.info(
                f"Webhook retry scheduled",
                extra={
                    "webhook_id": str(webhook.id),
                    "retry_at": webhook.next_retry_at.isoformat()
                }
            )
        else:
            webhook.status = WebhookStatus.FAILED
            webhook.failed_at = get_current_datetime()
            
            logger.error(
                f"Webhook delivery failed after max attempts",
                extra={"webhook_id": str(webhook.id)}
            )
        
        await db.commit()
        return False
    
    @staticmethod
    async def retry_pending_webhooks(db: AsyncSession):
        """
        Retry pending webhooks that are due for retry
        
        Args:
            db: Database session
        """
        now = get_current_datetime()
        
        stmt = select(Webhook).where(
            Webhook.status == WebhookStatus.PENDING,
            Webhook.next_retry_at <= now,
            Webhook.attempt_count < Webhook.max_attempts
        ).limit(100)  # Process in batches
        
        result = await db.execute(stmt)
        webhooks = result.scalars().all()
        
        logger.info(f"Retrying {len(webhooks)} pending webhooks")
        
        for webhook in webhooks:
            # Get merchant
            from app.models.merchant import Merchant
            merchant_stmt = select(Merchant).where(Merchant.id == webhook.merchant_id)
            merchant_result = await db.execute(merchant_stmt)
            merchant = merchant_result.scalar_one_or_none()
            
            if merchant:
                await WebhookService.deliver_webhook(webhook, merchant, db)


# Global service instance
webhook_service = WebhookService()
