"""
PayU UPI Intent (Server-to-Server) Service

Separate from the merchant-hosted `_payment` form flow (app/services/payu.py)
and from the SprintNXT UPI service. This performs a true S2S POST to PayU's
`_payment` endpoint with pg=UPI / bankcode=INTENT / txn_s2s_flow=4 and parses
the UPI intent deeplink (`intentURIData`) out of the JSON response, so you can
render a `upi://pay?...` link / QR yourself.

Reference: https://docs.payu.in/docs/upi-intent-server-to-server
"""

import logging
from typing import Any, Dict, Optional

import httpx

from app.config import settings
from app.core.exceptions import (
    UpstreamServiceError,
    UpstreamTimeoutError,
    UpstreamInvalidResponseError,
)
from app.services.payu import generate_intent_hash, normalize_amount, payment_endpoint

logger = logging.getLogger(__name__)

# Generic UPI intent bank code (QR / app tray). Specific apps: TEZ, PHONEPE, PAYTM, ...
DEFAULT_BANKCODE = "INTENT"


class PayUIntentService:
    """Server-to-server PayU UPI Intent client."""

    def __init__(self):
        self.endpoint = payment_endpoint(settings.PAYU_ENVIRONMENT)
        self.key = settings.PAYU_MERCHANT_KEY
        self.salt = settings.PAYU_SALT
        self.timeout = settings.PAYU_TIMEOUT
        self.surl = settings.PAYU_SURL
        self.furl = settings.PAYU_FURL

    @staticmethod
    def _build_deeplink(intent_uri_data: str) -> str:
        """
        Turn PayU's `intentURIData` into a fully-qualified UPI deeplink.

        PayU may return either a bare query string (e.g. "pa=...&pn=...") or an
        already-complete "upi://pay?..." value. Prefix only when needed.
        """
        if not intent_uri_data:
            return ""
        if intent_uri_data.startswith("upi://"):
            return intent_uri_data
        return f"upi://pay?{intent_uri_data}"

    async def create_intent(
        self,
        *,
        txnid: str,
        amount,
        productinfo: str,
        firstname: str,
        email: str,
        phone: str,
        s2s_client_ip: str,
        s2s_device_info: str,
        bankcode: str = DEFAULT_BANKCODE,
        upi_app_name: Optional[str] = None,
        udf1: str = "",
        udf2: str = "",
        udf3: str = "",
        udf4: str = "",
        udf5: str = "",
        surl: Optional[str] = None,
        furl: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Initiate a UPI Intent transaction via PayU S2S and return the deeplink.

        Args:
            txnid: Unique merchant transaction id.
            amount: Amount (normalized to "0.00").
            productinfo / firstname / email / phone: Customer/order details.
            s2s_client_ip: End-customer device IP (fraud/chargeback signal).
            s2s_device_info: End-customer User-Agent.
            bankcode: INTENT (generic) or app-specific (TEZ/PHONEPE/PAYTM/...).
            upi_app_name: For specific intent (phonepe/googlepay/paytm/...).
            udf1..udf5: Optional user-defined fields (hashed).
            surl / furl: Override default success/failure URLs.

        Returns:
            Dict with: intent_url, txn_status, unmapped_status, payment_id,
            reference_id, merchant_vpa, merchant_name, amount, acs_template,
            raw_response.

        Raises:
            RuntimeError: If PayU credentials are not configured.
            UpstreamServiceError / UpstreamTimeoutError / UpstreamInvalidResponseError
        """
        if not self.key or not self.salt:
            raise RuntimeError("PayU credentials are not configured (PAYU_MERCHANT_KEY/PAYU_SALT)")

        amount_str = normalize_amount(amount)

        hash_params = {
            "key": self.key,
            "txnid": txnid,
            "amount": amount_str,
            "productinfo": productinfo,
            "firstname": firstname,
            "email": email,
            "udf1": udf1,
            "udf2": udf2,
            "udf3": udf3,
            "udf4": udf4,
            "udf5": udf5,
        }
        hash_value = generate_intent_hash(hash_params, self.salt)

        payload = {
            **hash_params,
            "phone": phone,
            "pg": "UPI",
            "bankcode": bankcode,
            "txn_s2s_flow": "4",
            "s2s_client_ip": s2s_client_ip,
            "s2s_device_info": s2s_device_info,
            "surl": surl or self.surl,
            "furl": furl or self.furl,
            "hash": hash_value,
        }
        if upi_app_name:
            payload["upiAppName"] = upi_app_name

        # Log a safe view (no salt/hash, masked phone).
        safe = {k: v for k, v in payload.items() if k != "hash"}
        safe["phone"] = (phone[:2] + "****" + phone[-2:]) if len(phone) >= 4 else "****"
        logger.info("PayU S2S UPI intent request", extra={"txnid": txnid, "payload": safe})

        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(self.endpoint, data=payload, headers=headers)

            try:
                data = response.json()
            except ValueError:
                logger.error(
                    "PayU intent non-JSON response",
                    extra={"txnid": txnid, "status": response.status_code,
                           "body": response.text[:500]},
                )
                raise UpstreamInvalidResponseError()

            meta = data.get("metaData", {}) or {}
            result = data.get("result", {}) or {}

            unmapped = (meta.get("unmappedStatus") or "").lower()
            intent_uri = result.get("intentURIData", "")

            if unmapped == "failure" or meta.get("txnStatus") == "failed":
                msg = meta.get("message") or "PayU UPI intent initiation failed"
                logger.error("PayU intent failed", extra={"txnid": txnid, "meta": meta})
                raise UpstreamServiceError(f"PayU UPI intent error: {msg}", service="PayU")

            if not intent_uri:
                logger.error("PayU intent missing intentURIData", extra={"txnid": txnid, "meta": meta})
                raise UpstreamInvalidResponseError()

            return {
                "intent_url": self._build_deeplink(intent_uri),
                "txn_status": meta.get("txnStatus"),
                "unmapped_status": meta.get("unmappedStatus"),
                "payment_id": result.get("paymentId"),
                "reference_id": meta.get("referenceId"),
                "merchant_vpa": result.get("merchantVpa"),
                "merchant_name": result.get("merchantName"),
                "amount": result.get("amount", amount_str),
                "acs_template": result.get("acsTemplate"),
                "raw_response": data,
            }

        except httpx.TimeoutException:
            logger.error("PayU intent timeout", extra={"txnid": txnid})
            raise UpstreamTimeoutError()
        except httpx.RequestError as e:
            logger.error("PayU intent request error: %s", e, extra={"txnid": txnid})
            raise UpstreamServiceError("Failed to connect to PayU", service="PayU")


# Global service instance
payu_intent_service = PayUIntentService()
