"""
PayU Collect Payment API — Merchant Hosted Checkout
Mounted at /v1/payu
"""

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import HTMLResponse
import json
import logging

from app.models.merchant import Merchant
from app.api.dependencies import get_current_merchant
from app.schemas.payu import CollectPaymentRequest, CollectPaymentResponse
from app.core.exceptions import ValidationError
from app.core.utils import generate_payment_id
from app.services import payu as payu_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/collect",
    response_model=CollectPaymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Collect Payment (Merchant Hosted Checkout)",
    description=(
        "Build a signed PayU _payment request. Submit the returned fields "
        "(or form_html) to the PayU action_url from the customer's browser so "
        "PayU can handle bank/3-D Secure redirects."
    ),
)
async def collect_payment(
    data: CollectPaymentRequest,
    as_form: bool = Query(
        False,
        description="If true, return the self-submitting HTML form directly (text/html).",
    ),
    merchant: Merchant = Depends(get_current_merchant),
):
    """
    Generate a signed PayU collect-payment request.

    **Authentication**: Required (HTTP Basic — key_id:key_secret)

    The SHA-512 hash is computed server-side over the exact posted fields; the
    salt is never returned. Instrument fields (pg, bankcode, vpa, address1) are
    passed through to PayU but are not part of the hash.
    """
    txnid = data.txnid or generate_payment_id()

    # Instrument/passthrough fields (not part of the hash).
    extra = {
        k: v
        for k, v in {
            "pg": data.pg,
            "bankcode": data.bankcode,
            "vpa": data.vpa,
            "address1": data.address1,
        }.items()
        if v
    }

    # Aggregator split-during-transaction: serialize once so the exact same
    # string is used for both the hash and the posted splitRequest field.
    split_request = (
        json.dumps(data.split_request, separators=(",", ":")) if data.split_request else None
    )

    logger.info(
        "PayU collect payment request",
        extra={"merchant_id": str(merchant.id), "txnid": txnid, "split": bool(split_request)},
    )

    try:
        result = payu_service.build_collect_payment(
            txnid=txnid,
            amount=data.amount,
            productinfo=data.product_info,
            firstname=data.first_name,
            email=data.email,
            phone=data.phone,
            surl=data.surl,
            furl=data.furl,
            udf1=data.udf1,
            udf2=data.udf2,
            udf3=data.udf3,
            udf4=data.udf4,
            udf5=data.udf5,
            extra=extra or None,
            split_request=split_request,
        )
    except ValueError as e:
        # e.g. invalid amount
        raise ValidationError(str(e), field="amount")
    except RuntimeError as e:
        logger.error("PayU not configured: %s", e)
        raise ValidationError(str(e))

    if as_form:
        return HTMLResponse(content=result["form_html"])

    return CollectPaymentResponse(
        txnid=txnid,
        action_url=result["action_url"],
        fields=result["fields"],
        form_html=result["form_html"],
    )
