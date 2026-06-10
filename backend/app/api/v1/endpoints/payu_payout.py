"""
PayU Payouts API
Mounted at /v1/payu-payout

Disburse funds via PayU Payouts (separate product from the collect/intent flows
and from SprintNXT). All endpoints require merchant auth (HTTP Basic key_id:key_secret)
and use a server-side cached PayU OAuth token.
"""

import logging

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.api.dependencies import get_current_merchant
from app.core.exceptions import ValidationError
from app.models.merchant import Merchant
from app.schemas.payu_payout import (
    CancelTransferRequest,
    CheckStatusRequest,
    CreateBeneficiaryRequest,
    CreateSmartSendRequest,
    DisableQueuedRequest,
    InitiateTransferRequest,
    PayoutResponse,
    SetWebhookRequest,
    VerifyAccountRequest,
)
from app.services.payu_payout import payu_payout_service

logger = logging.getLogger(__name__)

router = APIRouter()


def _handle_config_error(e: RuntimeError):
    logger.error("PayU Payouts not configured: %s", e)
    raise ValidationError(str(e))


@router.post(
    "/transfers",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Initiate Transfer (IMPS/NEFT/RTGS/UPI)",
)
async def initiate_transfer(
    data: InitiateTransferRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Initiate one or more payouts to bank accounts or UPI VPAs."""
    payload = [t.model_dump(exclude_none=True) for t in data.transfers]
    logger.info(
        "PayU payout initiate",
        extra={"merchant_id": str(merchant.id), "count": len(payload)},
    )
    try:
        return await payu_payout_service.initiate_transfer(payload)
    except RuntimeError as e:
        _handle_config_error(e)


@router.post(
    "/transfers/status",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Check Transfer Status",
)
async def check_status(
    data: CheckStatusRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Look up transfer status by merchantRefId / batchId / status / date range."""
    try:
        return await payu_payout_service.check_status(
            transfer_status=data.transferStatus,
            date_from=data.date_from,
            date_to=data.date_to,
            page=data.page,
            page_size=data.pageSize,
            merchant_ref_id=data.merchantRefId,
            batch_id=data.batchId,
        )
    except RuntimeError as e:
        _handle_config_error(e)


@router.post(
    "/transfers/cancel",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancel a queued transfer",
)
async def cancel_transfer(
    data: CancelTransferRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Cancel a transfer while it is still in QUEUED/SCHEDULED state."""
    try:
        return await payu_payout_service.cancel_transfer(data.merchantRefId)
    except RuntimeError as e:
        _handle_config_error(e)


@router.post(
    "/queue-flag",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Disable queued payouts (mark as failed on low balance)",
)
async def disable_queued(
    data: DisableQueuedRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        return await payu_payout_service.disable_queued(
            queue_txn=data.queueTxn, config_merchant_id=data.configMerchantId
        )
    except RuntimeError as e:
        _handle_config_error(e)


@router.post(
    "/verify-account",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify bank account (penny test / name match)",
)
async def verify_account(
    data: VerifyAccountRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        return await payu_payout_service.verify_account(
            account_number=data.accountNumber,
            ifsc_code=data.ifscCode,
            merchant_ref_id=data.merchantRefId,
            bene_name=data.beneName,
            validate_ifsc=data.validateIfsc,
            name_matching=data.nameMatching,
            purpose=data.purpose,
            amount=data.amount,
        )
    except RuntimeError as e:
        _handle_config_error(e)


@router.get(
    "/validate-vpa",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate a UPI VPA",
)
async def validate_vpa(
    vpa: str = Query(..., description="UPI VPA to validate, e.g. name@bank"),
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        return await payu_payout_service.validate_vpa(vpa)
    except RuntimeError as e:
        _handle_config_error(e)


@router.get(
    "/ifsc/{ifsc}",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Get IFSC details",
)
async def get_ifsc_details(
    ifsc: str,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        return await payu_payout_service.get_ifsc_details(ifsc)
    except RuntimeError as e:
        _handle_config_error(e)


@router.post(
    "/smart-send",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Create a Smart Send link",
)
async def create_smart_send(
    data: CreateSmartSendRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Create a Smart Send link when beneficiary bank/VPA details are unknown."""
    try:
        return await payu_payout_service.create_smart_send(
            amount=data.amount,
            merchant_ref_id=data.merchantRefId,
            cust_name=data.custName,
            description=data.description,
            cust_mobile=data.custMobile,
            cust_email=data.custEmail,
            expiry_date=data.expiryDate,
        )
    except RuntimeError as e:
        _handle_config_error(e)


@router.get(
    "/smart-send/details",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Smart Send link details",
)
async def smart_send_details(
    merchantRefId: str = Query(..., description="Reference ID used when creating the link"),
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        return await payu_payout_service.smart_send_details(merchantRefId)
    except RuntimeError as e:
        _handle_config_error(e)


@router.post(
    "/smart-send/bulk-upload",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Bulk upload Smart Send transfers (.csv/.xlsx/.xls)",
)
async def bulk_upload(
    file: UploadFile = File(..., description="CSV/XLSX/XLS file of Smart Send transfers"),
    merchant: Merchant = Depends(get_current_merchant),
):
    """Upload a bulk Smart Send file; returns a fileId to process/track."""
    content = await file.read()
    try:
        return await payu_payout_service.bulk_upload_transfers(
            file_bytes=content,
            filename=file.filename or "bulk_smart_send.xlsx",
            content_type=file.content_type,
        )
    except RuntimeError as e:
        _handle_config_error(e)


@router.put(
    "/smart-send/bulk-process/{file_id}",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Process an uploaded bulk Smart Send file",
)
async def bulk_process(
    file_id: str,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        return await payu_payout_service.bulk_process_file(file_id)
    except RuntimeError as e:
        _handle_config_error(e)


@router.get(
    "/bulk-upload/status/{file_id}",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Get bulk upload/processing status",
)
async def bulk_status(
    file_id: str,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        return await payu_payout_service.bulk_upload_status(file_id)
    except RuntimeError as e:
        _handle_config_error(e)


@router.get(
    "/beneficiaries/{beneficiary_id}",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="View beneficiary details",
)
async def get_beneficiary(
    beneficiary_id: str,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        return await payu_payout_service.get_beneficiary(beneficiary_id)
    except RuntimeError as e:
        _handle_config_error(e)


@router.post(
    "/beneficiaries",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Create / register a beneficiary",
)
async def create_beneficiary(
    data: CreateBeneficiaryRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    try:
        return await payu_payout_service.create_beneficiary(data.model_dump(exclude_none=True))
    except RuntimeError as e:
        _handle_config_error(e)


@router.post(
    "/webhook",
    response_model=PayoutResponse,
    status_code=status.HTTP_200_OK,
    summary="Set payout event webhook(s)",
)
async def set_webhook(
    data: SetWebhookRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    payload = [w.model_dump(exclude_none=True) for w in data.webhooks]
    try:
        return await payu_payout_service.set_webhook(payload)
    except RuntimeError as e:
        _handle_config_error(e)
