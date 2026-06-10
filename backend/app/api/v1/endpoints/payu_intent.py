"""
PayU UPI Intent (Server-to-Server) API
Mounted at /v1/payu-intent

Separate from the merchant-hosted /v1/payu/collect form flow and from SprintNXT.
"""

import logging

from fastapi import APIRouter, Depends, Request, status

from app.models.merchant import Merchant
from app.api.dependencies import get_current_merchant
from app.schemas.payu_intent import PayUIntentCreate, PayUIntentResponse
from app.core.exceptions import ValidationError
from app.core.utils import generate_payment_id
from app.services.payu_intent import payu_intent_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/create",
    response_model=PayUIntentResponse,
    status_code=status.HTTP_200_OK,
    summary="Create PayU UPI Intent (S2S)",
    description=(
        "Initiate a server-to-server PayU UPI Intent and return a upi://pay "
        "deeplink to render as a link or QR. Does not redirect to PayU."
    ),
)
async def create_payu_intent(
    data: PayUIntentCreate,
    request: Request,
    merchant: Merchant = Depends(get_current_merchant),
):
    """
    Create a UPI Intent via PayU S2S.

    **Authentication**: Required (HTTP Basic — key_id:key_secret)

    `s2s_client_ip` and `s2s_device_info` are taken from the request body when
    provided, otherwise inferred from the caller's IP / User-Agent.
    """
    txnid = data.txnid or generate_payment_id()

    client_ip = data.s2s_client_ip or (request.client.host if request.client else "0.0.0.0")
    device_info = data.s2s_device_info or request.headers.get("user-agent", "unknown")

    logger.info(
        "PayU UPI intent request",
        extra={"merchant_id": str(merchant.id), "txnid": txnid, "bankcode": data.bankcode},
    )

    try:
        result = await payu_intent_service.create_intent(
            txnid=txnid,
            amount=data.amount,
            productinfo=data.product_info,
            firstname=data.first_name,
            email=data.email,
            phone=data.phone,
            s2s_client_ip=client_ip,
            s2s_device_info=device_info,
            bankcode=data.bankcode,
            upi_app_name=data.upi_app_name,
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

    return PayUIntentResponse(
        txnid=txnid,
        intent_url=result["intent_url"],
        qr_code_data_uri=result.get("qr_code_data_uri"),
        txn_status=result.get("txn_status"),
        unmapped_status=result.get("unmapped_status"),
        payment_id=result.get("payment_id"),
        reference_id=result.get("reference_id"),
        merchant_vpa=result.get("merchant_vpa"),
        merchant_name=result.get("merchant_name"),
        amount=result.get("amount"),
    )
