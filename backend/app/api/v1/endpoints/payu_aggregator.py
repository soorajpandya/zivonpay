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
    SettlementRangeRequest,
    SettlementTransactionDetailsRequest,
    SplitAfterTransactionRequest,
    SplitInfoRequest,
    SplitRefundRequest,
    SplitRefundStatusRequest,
    SplitTransactionsRequest,
    UpdateBankDetailsRequest,
    UpdateSubAccountRequest,
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


@router.put(
    "/child-merchants/{product_account_uuid}",
    response_model=AggregatorResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Child Merchant / Sub-Account Details",
    description=(
        "Update arbitrary child-merchant (sub-account) details by its product "
        "account UUID (name, mobile, business fields, bank_detail, etc.). Any "
        "PayU product_account fields are passed through."
    ),
)
async def update_sub_account(
    product_account_uuid: str,
    data: UpdateSubAccountRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    fields = data.model_dump(exclude_none=True)
    try:
        result = await payu_aggregator_service.update_sub_account(
            product_account_uuid=product_account_uuid, fields=fields
        )
    except RuntimeError as e:
        _handle_config_error(e)
    return AggregatorResponse(response=result)


@router.get(
    "/child-merchants",
    response_model=AggregatorResponse,
    status_code=status.HTTP_200_OK,
    summary="Fetch Child Merchants (Sub Account Listing v1)",
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


@router.get(
    "/child-merchants/search",
    response_model=AggregatorResponse,
    status_code=status.HTTP_200_OK,
    summary="Fetch Child Merchants Details (Sub Account Listing v3)",
    description=(
        "Sub Account Listing API v3 — fetch child merchants for the parent "
        "merchant, optionally filtered. `search_term` is one of identifier, "
        "phone, email, name, brand_name, merchant_defined_identifier; "
        "`search_text` is the value to match."
    ),
)
async def search_child_merchants(
    identifier: Optional[str] = Query(
        None, description="Parent merchant MID/UUID in the path (defaults to configured parent UUID/MID)"
    ),
    search_term: Optional[str] = Query(
        None, description="identifier | phone | email | name | brand_name | merchant_defined_identifier"
    ),
    search_text: Optional[str] = Query(None, description="Search value to match against search_term"),
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        result = await payu_aggregator_service.list_sub_accounts_v3(
            identifier, search_term=search_term, search_text=search_text
        )
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


@router.post(
    "/split-info",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Split Info",
    description="Get split info for a parent transaction (get_split_info command).",
)
async def get_split_info(
    data: SplitInfoRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        result = await payu_txn_service.get_split_info(data.payu_id)
    except RuntimeError as e:
        _handle_config_error(e)
    return PayUTransactionResponse(command="get_split_info", response=result)


@router.post(
    "/split-transactions",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Child/Parent Split Transaction Info",
    description=(
        "Fetch child or parent split transactions for a date range "
        "(get_split_transactions command). Filter by child merchant_key in var5."
    ),
)
async def get_split_transactions(
    data: SplitTransactionsRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        result = await payu_txn_service.get_split_transactions(
            date_from=data.date_from,
            date_to=data.date_to,
            page=data.page,
            page_size=data.page_size,
            merchant_key=data.merchant_key,
        )
    except RuntimeError as e:
        _handle_config_error(e)
    return PayUTransactionResponse(command="get_split_transactions", response=result)


@router.get(
    "/settlement/range",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Settlement Detail Range",
    description=(
        "Settlement reconciliation for a date range (/settlement/range). "
        "Uses HMAC auth with merchant key + salt."
    ),
)
async def settlement_detail_range(
    dateFrom: str = Query(..., description="Start date YYYY-MM-DD"),
    dateTo: Optional[str] = Query(None, description="End date YYYY-MM-DD (max 3-day range)"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(100, ge=1, le=50000),
    merchantId: Optional[str] = Query(None),
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        result = await payu_txn_service.settlement_detail_range(
            date_from=dateFrom,
            date_to=dateTo,
            page=page,
            page_size=pageSize,
            merchant_id=merchantId,
        )
    except RuntimeError as e:
        _handle_config_error(e)
    return PayUTransactionResponse(command="settlement/range", response=result)


@router.get(
    "/settlement/transaction-details",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Settlement Transaction Details",
    description="Settlement details for a merchant transaction id (/settlement/transactionDetails).",
)
async def settlement_transaction_details(
    merchantTransactionId: str = Query(..., description="Merchant txnid"),
    mid: str = Query(..., description="PayU merchant id (MID)"),
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        result = await payu_txn_service.settlement_transaction_details(
            merchant_transaction_id=merchantTransactionId, mid=mid
        )
    except RuntimeError as e:
        _handle_config_error(e)
    return PayUTransactionResponse(command="settlement/transactionDetails", response=result)


@router.post(
    "/refund",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Refund Split Transaction",
    description=(
        "Refund a split-settlement transaction with per-child breakdown (var8 on "
        "cancel_refund_transaction)."
    ),
)
async def split_refund(
    data: SplitRefundRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    split_info = {
        key: seg.model_dump(exclude_none=True) for key, seg in data.split_refund_info.items()
    }
    try:
        result = await payu_txn_service.refund(
            mihpayid=data.mihpayid,
            token_id=data.token_id,
            amount=data.amount,
            split_refund_info=split_info,
        )
    except ValueError as e:
        raise ValidationError(str(e), field="amount")
    except RuntimeError as e:
        _handle_config_error(e)
    return PayUTransactionResponse(command="cancel_refund_transaction", response=result)


@router.post(
    "/refund-status",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Split Refund Status",
    description="Check refund status for a split payment (aggregator_check_action_status_txnid).",
)
async def split_refund_status(
    data: SplitRefundStatusRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        result = await payu_txn_service.aggregator_refund_status(data.txnid)
    except RuntimeError as e:
        _handle_config_error(e)
    return PayUTransactionResponse(command="aggregator_check_action_status_txnid", response=result)
