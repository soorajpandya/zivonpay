"""
Logs API Endpoints - View recent application logs
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional
import logging

from app.models.merchant import Merchant
from app.api.dependencies import get_current_merchant
from app.schemas.logs import AppLogListResponse, AppLogResponse
from app.services.log_buffer import log_buffer

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "",
    response_model=AppLogListResponse,
    summary="List Application Logs",
    description="View recent application log entries from the in-memory buffer",
)
async def list_logs(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=500, description="Page size (max 500)"),
    level: Optional[str] = Query(None, description="Filter by log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)"),
    logger_name: Optional[str] = Query(None, alias="logger", description="Filter by logger name (substring match)"),
    search: Optional[str] = Query(None, description="Full-text search in message, request_id, merchant_id"),
    merchant: Merchant = Depends(get_current_merchant),
):
    """
    View recent application logs from the in-memory ring buffer.

    The buffer stores the last 5 000 log entries. Logs are returned newest-first.

    **Authentication**: Required (HTTP Basic — key_id:key_secret)

    **Filters**: level, logger, search
    """
    records, total = log_buffer.get_logs(
        skip=skip,
        limit=limit,
        level=level,
        logger_name=logger_name,
        search=search,
    )

    data = [
        AppLogResponse(
            id=r.id,
            timestamp=r.timestamp,
            level=r.level,
            logger=r.logger_name,
            message=r.message,
            request_id=r.request_id,
            merchant_id=r.merchant_id,
            extra=r.extra,
        )
        for r in records
    ]

    return AppLogListResponse(
        entity="list",
        count=len(data),
        total_in_buffer=total,
        data=data,
    )
