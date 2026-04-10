"""
Audit API Endpoints - View audit trail
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID
import logging

from app.database import get_db
from app.models.merchant import Merchant
from app.api.dependencies import get_current_merchant
from app.schemas.audit import AuditLogResponse, AuditLogListResponse
from app.services.audit import audit_service
from app.core.exceptions import ResourceNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "",
    response_model=AuditLogListResponse,
    summary="List Audit Logs",
    description="List audit trail entries for the authenticated merchant",
)
async def list_audit_logs(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(50, ge=1, le=100, description="Page size (max 100)"),
    action: Optional[str] = Query(None, description="Filter by action (e.g., order.create)"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (e.g., order, payment)"),
    entity_id: Optional[UUID] = Query(None, description="Filter by entity ID"),
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
):
    """
    List audit log entries for the authenticated merchant.

    **Authentication**: Required (HTTP Basic — key_id:key_secret)

    **Filters**: action, entity_type, entity_id

    **Pagination**: Use skip and limit parameters
    """
    logger.info(
        "List audit logs request",
        extra={
            "merchant_id": str(merchant.id),
            "action_filter": action,
            "entity_type_filter": entity_type,
        },
    )

    logs = await audit_service.list_audit_logs(
        merchant=merchant,
        db=db,
        skip=skip,
        limit=limit,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
    )

    responses = [audit_service.audit_to_response(log) for log in logs]

    return AuditLogListResponse(
        entity="list",
        count=len(responses),
        data=responses,
    )


@router.get(
    "/{audit_id}",
    response_model=AuditLogResponse,
    summary="Get Audit Log",
    description="Get a single audit log entry by ID",
)
async def get_audit_log(
    audit_id: UUID,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single audit log entry by ID.

    **Authentication**: Required (HTTP Basic — key_id:key_secret)
    """
    log = await audit_service.get_audit_log(merchant, audit_id, db)

    if not log:
        raise ResourceNotFoundError(resource_type="AuditLog", resource_id=str(audit_id))

    return audit_service.audit_to_response(log)
