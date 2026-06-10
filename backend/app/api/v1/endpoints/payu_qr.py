"""
PayU Dynamic QR (Server-to-Server) API
Mounted at /v1/payu-qr

Generates a dynamic UPI QR string for offline payment collection. Separate from
the merchant-hosted /v1/payu/collect form flow and the /v1/payu-intent flow.
"""

import logging

from fastapi import APIRouter, Depends, Request, status

from app.models.merchant import Merchant
from app.api.dependencies import get_current_merchant
from app.schemas.payu_qr import (
    PayUQRCreate,
    PayUQRResponse,
    VerifyPaymentRequest,
    CheckPaymentRequest,
    RefundRequest,
    RefundStatusRequest,
    PayUTransactionResponse,
)
from app.core.exceptions import ValidationError
from app.core.utils import generate_payment_id
from app.services.payu_qr import payu_qr_service
from app.services.payu_txn import payu_txn_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/create",
    response_model=PayUQRResponse,
    status_code=status.HTTP_200_OK,
    summary="Create PayU Dynamic QR (S2S)",
    description=(
        "Generate a dynamic UPI QR via PayU S2S (pg=DBQR / bankcode=UPIDBQR) and "
        "return a upi://pay deeplink to render as a QR for offline collection. "
        "Does not redirect to PayU."
    ),
)
async def create_payu_qr(
    data: PayUQRCreate,
    request: Request,
    merchant: Merchant = Depends(get_current_merchant),
):
    """
    Create a dynamic UPI QR via PayU S2S.

    **Authentication**: Required (HTTP Basic — key_id:key_secret)

    `s2s_client_ip` and `s2s_device_info` are taken from the request body when
    provided, otherwise inferred from the caller's IP / User-Agent.
    """
    txnid = data.txnid or generate_payment_id()

    client_ip = data.s2s_client_ip or (request.client.host if request.client else "0.0.0.0")
    device_info = data.s2s_device_info or request.headers.get("user-agent", "unknown")

    logger.info(
        "PayU dynamic QR request",
        extra={"merchant_id": str(merchant.id), "txnid": txnid},
    )

    try:
        result = await payu_qr_service.create_qr(
            txnid=txnid,
            amount=data.amount,
            productinfo=data.product_info,
            firstname=data.first_name,
            email=data.email,
            phone=data.phone,
            s2s_client_ip=client_ip,
            s2s_device_info=device_info,
            expiry_time=data.expiry_time,
            udf1=data.udf1,
            udf2=data.udf2,
            udf3=data.udf3,
            udf4=data.udf4,
            udf5=data.udf5,
            surl=data.surl,
            furl=data.furl,
        )
    except ValueError as e:
        raise ValidationError(str(e), field="amount")
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))

    return PayUQRResponse(
        txnid=txnid,
        qr_string=result["qr_string"],
        txn_status=result.get("txn_status"),
        unmapped_status=result.get("unmapped_status"),
        payment_id=result.get("payment_id"),
        reference_id=result.get("reference_id"),
        merchant_vpa=result.get("merchant_vpa"),
        merchant_name=result.get("merchant_name"),
        amount=result.get("amount"),
    )


@router.post(
    "/verify-payment",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify Payment (by txnid)",
    description=(
        "Check a QR (or any PayU) transaction's status using your merchant "
        "txnid via PayU's verify_payment command."
    ),
)
async def verify_payment(
    data: VerifyPaymentRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Look up a transaction status by merchant txnid."""
    try:
        result = await payu_txn_service.verify_payment(data.txnid)
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="verify_payment", response=result)


@router.post(
    "/check-payment",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Check Payment (by mihpayid)",
    description=(
        "Check a transaction's status using PayU's transaction id (mihpayid) "
        "via PayU's check_payment command."
    ),
)
async def check_payment(
    data: CheckPaymentRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Look up a transaction status by PayU id (mihpayid)."""
    try:
        result = await payu_txn_service.check_payment(data.mihpayid)
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="check_payment", response=result)


@router.post(
    "/refund",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Refund Transaction (full/partial)",
    description=(
        "Initiate a full or partial refund (or cancel an authorized "
        "transaction) via PayU's cancel_refund_transaction command."
    ),
)
async def refund_transaction(
    data: RefundRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Initiate a refund against a PayU transaction."""
    try:
        result = await payu_txn_service.refund(
            mihpayid=data.mihpayid,
            token_id=data.token_id,
            amount=data.amount,
        )
    except ValueError as e:
        raise ValidationError(str(e), field="amount")
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="cancel_refund_transaction", response=result)


@router.post(
    "/refund-status",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Refund Status",
    description=(
        "Check the status of a refund/cancel request via PayU's "
        "check_action_status command."
    ),
)
async def refund_status(
    data: RefundStatusRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Check refund/cancel request status."""
    try:
        result = await payu_txn_service.refund_status(data.mihpayid, data.request_id)
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="check_action_status", response=result)
