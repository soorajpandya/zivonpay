"""
Audit Service - Business logic for audit log operations
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
import logging

from app.models.merchant import Merchant
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse, AuditLogListResponse

logger = logging.getLogger(__name__)


class AuditService:
    """Service for audit log operations"""

    @staticmethod
    async def create_audit_log(
        db: AsyncSession,
        action: str,
        merchant_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[UUID] = None,
        request_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        http_method: Optional[str] = None,
        changes: Optional[Dict[str, Any]] = None,
        extra_data: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Create a new audit log entry.

        Args:
            db: Database session
            action: Action performed (e.g., 'order.create', 'payment.capture')
            merchant_id: ID of the merchant performing the action
            entity_type: Type of entity acted upon ('order', 'payment', etc.)
            entity_id: ID of the entity acted upon
            request_id: Unique request identifier
            endpoint: API endpoint hit
            http_method: HTTP method used
            changes: Before/after data changes
            extra_data: Additional context

        Returns:
            Created AuditLog object
        """
        audit_log = AuditLog(
            merchant_id=merchant_id,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            request_id=request_id,
            endpoint=endpoint,
            http_method=http_method,
            changes=changes,
            extra_data=extra_data or {},
        )

        db.add(audit_log)
        await db.commit()
        await db.refresh(audit_log)

        logger.debug(
            f"Audit log created: {action}",
            extra={
                "audit_id": str(audit_log.id),
                "action": action,
                "entity_type": entity_type,
                "entity_id": str(entity_id) if entity_id else None,
            },
        )

        return audit_log

    @staticmethod
    async def list_audit_logs(
        merchant: Merchant,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[UUID] = None,
    ) -> List[AuditLog]:
        """
        List audit logs for a merchant with optional filters.

        Args:
            merchant: Merchant object (scoping)
            db: Database session
            skip: Pagination offset
            limit: Page size (max 100)
            action: Filter by action (e.g., 'order.create')
            entity_type: Filter by entity type (e.g., 'order')
            entity_id: Filter by entity ID

        Returns:
            List of AuditLog objects
        """
        conditions = [AuditLog.merchant_id == merchant.id]

        if action:
            conditions.append(AuditLog.action == action)
        if entity_type:
            conditions.append(AuditLog.entity_type == entity_type)
        if entity_id:
            conditions.append(AuditLog.entity_id == entity_id)

        stmt = (
            select(AuditLog)
            .where(and_(*conditions))
            .order_by(desc(AuditLog.created_at))
            .offset(skip)
            .limit(min(limit, 100))
        )

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_audit_log(
        merchant: Merchant,
        audit_id: UUID,
        db: AsyncSession,
    ) -> Optional[AuditLog]:
        """Get a single audit log by ID, scoped to the merchant."""
        stmt = select(AuditLog).where(
            and_(
                AuditLog.id == audit_id,
                AuditLog.merchant_id == merchant.id,
            )
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    def audit_to_response(audit_log: AuditLog) -> AuditLogResponse:
        """Convert AuditLog model to response schema"""
        return AuditLogResponse(
            id=audit_log.id,
            merchant_id=audit_log.merchant_id,
            user_id=audit_log.user_id,
            ip_address=str(audit_log.ip_address) if audit_log.ip_address else None,
            user_agent=audit_log.user_agent,
            action=audit_log.action,
            entity_type=audit_log.entity_type,
            entity_id=audit_log.entity_id,
            request_id=audit_log.request_id,
            endpoint=audit_log.endpoint,
            http_method=audit_log.http_method,
            changes=audit_log.changes,
            extra_data=audit_log.extra_data,
            created_at=int(audit_log.created_at.timestamp()),
        )


# Global service instance
audit_service = AuditService()
