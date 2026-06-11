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
    OfflineIntentLinkRequest,
    ExpireIntentLinkRequest,
    InstaStaticQRRequest,
    DeactivateVpaRequest,
    IntegratedStaticBharatQRRequest,
    PrintInvoiceQRRequest,
    SendInvoiceSmsRequest,
    QRTransactionStatusRequest,
    CancelQRTransactionRequest,
    BharatQRPaymentInitRequest,
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


# ── UPI QR API suite ──


def _var1_from(model) -> dict:
    """Build a PayU var1 dict from a request model, dropping control/None fields."""
    data = model.model_dump(by_alias=True, exclude_none=True)
    data.pop("regenerate", None)
    return data


@router.post(
    "/intent-link",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Offline Intent Link Generation",
    description="Generate a UPI intent payment link (generate_upi_intent) to share with customers.",
)
async def offline_intent_link(
    data: OfflineIntentLinkRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Generate an offline UPI intent payment link."""
    try:
        result = await payu_txn_service.generate_offline_intent_link(_var1_from(data))
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="generate_upi_intent", response=result)


@router.post(
    "/intent-link/expire",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Expire Intent Link",
    description="Expire one or more UPI intent links (expire_intent_link). Max 100 per call.",
)
async def expire_intent_link(
    data: ExpireIntentLinkRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Expire UPI intent links."""
    try:
        result = await payu_txn_service.expire_intent_link(data.transaction_ids)
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="expire_intent_link", response=result)


@router.post(
    "/insta-static-qr",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Insta Static QR Generation / Regeneration",
    description=(
        "Generate a static UPI/Bharat QR (generate_insta_account). Set "
        "regenerate=true to re-issue an existing QR."
    ),
)
async def insta_static_qr(
    data: InstaStaticQRRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Generate or regenerate an Insta static QR."""
    try:
        result = await payu_txn_service.insta_static_qr(_var1_from(data), regenerate=data.regenerate)
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="generate_insta_account", response=result)


@router.post(
    "/deactivate-vpa",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Insta Deactivate VPA",
    description="Deactivate an Insta VPA / static QR (expire_insta_account).",
)
async def deactivate_vpa(
    data: DeactivateVpaRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Deactivate an Insta VPA / static QR."""
    try:
        result = await payu_txn_service.deactivate_vpa(data.merchantVpa, data.instaProduct)
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="expire_insta_account", response=result)


@router.post(
    "/bharat-qr",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Integrated Static Bharat QR Generation",
    description="Generate an integrated static Bharat QR (generate_dynamic_bharat_qr).",
)
async def integrated_static_bharat_qr(
    data: IntegratedStaticBharatQRRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Generate an integrated static Bharat QR."""
    try:
        result = await payu_txn_service.integrated_static_bharat_qr(_var1_from(data))
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="generate_dynamic_bharat_qr", response=result)


@router.post(
    "/bharat-qr/initiate-payment",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Payment Initiation — Integrated Bharat QR",
    description="Initiate a payment against an integrated static Bharat QR terminal (/QrPayment).",
)
async def bharat_qr_payment_init(
    data: BharatQRPaymentInitRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Initiate a payment on a static Bharat QR."""
    txnid = data.txnid or generate_payment_id()
    try:
        result = await payu_qr_service.initiate_bharat_qr_payment(
            txnid=txnid,
            amount=data.amount,
            qr_id=data.qr_id,
            productinfo=data.product_info,
            firstname=data.first_name,
            email=data.email,
            phone=data.phone,
            lastname=data.last_name,
            expiry_time=data.expiry_time,
            udf3=data.udf3,
            udf4=data.udf4,
            udf5=data.udf5,
        )
    except ValueError as e:
        raise ValidationError(str(e), field="amount")
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="QrPayment", response=result)


@router.post(
    "/invoice-qr",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Print Invoice QR",
    description="Generate an invoice QR (generate_invoice_qr).",
)
async def print_invoice_qr(
    data: PrintInvoiceQRRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Generate an invoice QR."""
    try:
        result = await payu_txn_service.print_invoice_qr(_var1_from(data))
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="generate_invoice_qr", response=result)


@router.post(
    "/invoice-qr/send-sms",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Send Invoice QR to SMS",
    description="Send an invoice QR to a customer via SMS (send_sdk_message).",
)
async def send_invoice_sms(
    data: SendInvoiceSmsRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Send an invoice QR to a customer via SMS."""
    try:
        result = await payu_txn_service.send_invoice_sms(data.payu_id, data.phone)
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="send_sdk_message", response=result)


@router.post(
    "/transaction-status",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Transaction Status Check (QR)",
    description="Check a QR/Bharat QR transaction status (check_bqr_txn_status).",
)
async def qr_transaction_status(
    data: QRTransactionStatusRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Check a QR transaction status."""
    try:
        result = await payu_txn_service.check_qr_transaction_status(
            data.transactionId, data.paymentmode, data.producttype
        )
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="check_bqr_txn_status", response=result)


@router.post(
    "/cancel",
    response_model=PayUTransactionResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancel QR Transaction",
    description="Cancel an in-progress QR transaction (cancel_qr_payment).",
)
async def cancel_qr_transaction(
    data: CancelQRTransactionRequest,
    merchant: Merchant = Depends(get_current_merchant),
):
    """Cancel an in-progress QR transaction."""
    try:
        result = await payu_txn_service.cancel_qr_transaction(data.transactionId, data.product_type)
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))
    return PayUTransactionResponse(command="cancel_qr_payment", response=result)
