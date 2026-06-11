"""
PayU Aggregator / Marketplace Settlement Solution API
Mounted at /v1/payu-aggregator

Endpoints for onboarding child merchants and managing split settlements:

  - POST   /token                                  Get a Hub client token
  - POST   /child-merchants                        Create / onboard a child merchant
  - PUT    /child-merchants/{uuid}/bank-details    Update a child merchant's bank details
  - GET    /child-merchants                        Fetch child merchants (sub account listing)
  - POST   /split                                  Split a captured transaction (after txn)
  - POST   /transactions                           Get aggregator/parent transaction info
  - POST   /release-settlement                     Release a blocked child sub-payment

Split *during* transaction is handled by POST /v1/payu/collect via the optional
``split_request`` field.

All endpoints require merchant auth (HTTP Basic key_id:key_secret).
"""

import logging

from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import get_current_merchant
from app.core.exceptions import ValidationError
from app.models.merchant import Merchant
from app.schemas.payu_aggregator import (
    AggregatorResponse,
    AggregatorTransactionsRequest,
    ClientTokenRequest,
    CreateChildMerchantRequest,
    ReleaseSettlementRequest,
    SplitAfterTransactionRequest,
    UpdateBankDetailsRequest,
)
from app.schemas.payu_qr import PayUTransactionResponse
from app.services.payu_aggregator import payu_aggregator_service
from app.services.payu_txn import payu_txn_service

logger = logging.getLogger(__name__)

router = APIRouter()


def _handle_config_error(e: RuntimeError):
    logger.error("PayU Aggregator not configured: %s", e)
    raise ValidationError(str(e))


# ── Onboarding ────────────────────────────────────────────────────────────────


@router.post(
    "/token",
    response_model=AggregatorResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Hub Client Token",
    description=(
        "Generate an OAuth client token from PayU's Hub for the aggregator "
        "scope (refer_child_merchant for onboarding, fetch_child_merchants for "
        "listing). Tokens are cached server-side; this endpoint is mainly for "
        "verification/debugging."
    ),
)
async def get_client_token(
    data: ClientTokenRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        result = await payu_aggregator_service.get_client_token(scope=data.scope, force_refresh=True)
    except RuntimeError as e:
        _handle_config_error(e)
    return AggregatorResponse(response=result)


@router.post(
    "/child-merchants",
    response_model=AggregatorResponse,
    status_code=status.HTTP_200_OK,
    summary="Create / Onboard Child Merchant",
    description=(
        "Onboard a child (sub-seller) merchant under the aggregator/parent MID. "
        "After creation, call the bank-details endpoint to add settlement bank "
        "details."
    ),
)
async def create_child_merchant(
    data: CreateChildMerchantRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    payload = data.model_dump(exclude_none=True)
    logger.info("PayU aggregator create child merchant", extra={"merchant_id": str(merchant.id)})
    try:
        result = await payu_aggregator_service.create_child_merchant(payload)
    except RuntimeError as e:
        _handle_config_error(e)
    return AggregatorResponse(response=result)


@router.put(
    "/child-merchants/{product_account_uuid}/bank-details",
    response_model=AggregatorResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Child Merchant Bank Details",
    description="Add/update the settlement bank account of a child merchant by its product account UUID.",
)
async def update_bank_details(
    product_account_uuid: str,
    data: UpdateBankDetailsRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        result = await payu_aggregator_service.update_bank_details(
            product_account_uuid=product_account_uuid,
            bank_detail=data.bank_detail.model_dump(),
        )
    except RuntimeError as e:
        _handle_config_error(e)
    return AggregatorResponse(response=result)


@router.get(
    "/child-merchants",
    response_model=AggregatorResponse,
    status_code=status.HTTP_200_OK,
    summary="Fetch Child Merchants (Sub Account Listing)",
    description=(
        "List all child merchants linked to the parent/aggregator merchant. "
        "Uses the configured parent UUID unless `parent_uuid` is provided."
    ),
)
async def list_child_merchants(
    parent_uuid: Optional[str] = Query(
        None, description="Parent merchant UUID (defaults to configured PAYU_AGG_PARENT_UUID)"
    ),
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        result = await payu_aggregator_service.list_sub_accounts(parent_uuid)
    except RuntimeError as e:
        _handle_config_error(e)
    return AggregatorResponse(response=result)


# ── Split settlements ────────────────────────────────────────────────────────


@router.post(
    "/split",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Split After Transaction",
    description=(
        "Split a captured parent transaction across child merchants "
        "(payment_split command). For 'absolute' the sub-amounts must sum to the "
        "transaction amount; for 'percentage' they must sum to 100."
    ),
)
async def split_after_transaction(
    data: SplitAfterTransactionRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    split_info = {
        key: seg.model_dump(exclude_none=True) for key, seg in data.split_info.items()
    }
    try:
        result = await payu_txn_service.payment_split(
            payu_id=data.payu_id,
            split_info=split_info,
            split_type=data.split_type,
        )
    except RuntimeError as e:
        _handle_config_error(e)
    return PayUTransactionResponse(command="payment_split", response=result)


@router.post(
    "/transactions",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Aggregator/Parent Transaction Info",
    description=(
        "Fetch parent/aggregator transactions and their split sub-transactions "
        "for a date range (get_aggregator_transactions command)."
    ),
)
async def get_aggregator_transactions(
    data: AggregatorTransactionsRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        result = await payu_txn_service.get_aggregator_transactions(
            date_from=data.date_from,
            date_to=data.date_to,
            page=data.page,
            page_size=data.page_size,
        )
    except RuntimeError as e:
        _handle_config_error(e)
    return PayUTransactionResponse(command="get_aggregator_transactions", response=result)


@router.post(
    "/release-settlement",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Release Settlement",
    description=(
        "Release a blocked child sub-payment so it settles to the child "
        "merchant (release_settlement command)."
    ),
)
async def release_settlement(
    data: ReleaseSettlementRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        result = await payu_txn_service.release_settlement(
            payu_id=data.payu_id, child_mid=data.child_mid
        )
    except RuntimeError as e:
        _handle_config_error(e)
    return PayUTransactionResponse(command="release_settlement", response=result)
