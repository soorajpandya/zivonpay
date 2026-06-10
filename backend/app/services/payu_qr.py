"""
PayU Dynamic QR (Server-to-Server) Service

Generates a dynamic UPI QR for offline payment collection by performing a true
S2S POST to PayU's `_payment` endpoint with pg=DBQR / bankcode=UPIDBQR /
txn_s2s_flow=4 and parsing the QR deeplink (`qrString`) out of the JSON
response, so you can render a `upi://pay?...` QR yourself.

Separate from the merchant-hosted `_payment` form flow (app/services/payu.py)
and the UPI Intent S2S flow (app/services/payu_intent.py).

Reference: https://docs.payu.in/docs/dynamic-qr-generation
"""

import logging
from typing import Any, Dict, Optional

import httpx

from app.config import settings
from app.core.exceptions import (
    UpstreamServiceError,
    UpstreamTimeoutError,
)
from app.services.payu import generate_payment_hash, normalize_amount, payment_endpoint

logger = logging.getLogger(__name__)

# Dynamic QR routing parameters (fixed by PayU for the DBQR product).
DBQR_PG = "DBQR"
DBQR_BANKCODE = "UPIDBQR"


class PayUQRService:
    """Server-to-server PayU Dynamic QR client."""

    def __init__(self):
        self.endpoint = payment_endpoint(settings.PAYU_ENVIRONMENT)
        self.key = settings.PAYU_MERCHANT_KEY
        self.salt = settings.PAYU_SALT
        self.timeout = settings.PAYU_TIMEOUT
        self.surl = settings.PAYU_SURL
        self.furl = settings.PAYU_FURL

    @staticmethod
    def _build_deeplink(qr_data: str) -> str:
        """
        Normalize PayU's QR value into a fully-qualified UPI deeplink.

        PayU may return either a bare query string (e.g. "pa=...&pn=...") or an
        already-complete "upi://pay?..." value. Prefix only when needed.
        """
        if not qr_data:
            return ""
        if qr_data.startswith("upi://"):
            return qr_data
        return f"upi://pay?{qr_data}"

    async def create_qr(
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
        expiry_time: Optional[int] = None,
        udf1: str = "",
        udf2: str = "",
        udf3: str = "",
        udf4: str = "",
        udf5: str = "",
        surl: Optional[str] = None,
        furl: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a dynamic UPI QR via PayU S2S and return the QR deeplink.

        Args:
            txnid: Unique merchant transaction id.
            amount: Amount (normalized to "0.00").
            productinfo / firstname / email / phone: Customer/order details.
            s2s_client_ip: End-customer device IP (fraud/chargeback signal).
            s2s_device_info: End-customer User-Agent.
            expiry_time: Optional QR validity in seconds (PayU expiry_time).
            udf1..udf5: Optional user-defined fields (hashed).
            surl / furl: Override default success/failure URLs.

        Returns:
            Dict with: qr_string, txn_status, unmapped_status, payment_id,
            reference_id, merchant_vpa, merchant_name, amount, raw_response.

        Raises:
            RuntimeError: If PayU credentials are not configured.
            UpstreamServiceError / UpstreamTimeoutError
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
        # Dynamic QR uses the standard _payment hash (no si_details).
        hash_value = generate_payment_hash(hash_params, self.salt)

        payload = {
            **hash_params,
            "phone": phone,
            "pg": DBQR_PG,
            "bankcode": DBQR_BANKCODE,
            "txn_s2s_flow": "4",
            "s2s_client_ip": s2s_client_ip,
            "s2s_device_info": s2s_device_info,
            "surl": surl or self.surl,
            "furl": furl or self.furl,
            "hash": hash_value,
        }
        if expiry_time:
            payload["expiry_time"] = str(expiry_time)

        # Log a safe view (no salt/hash, masked phone).
        safe = {k: v for k, v in payload.items() if k != "hash"}
        safe["phone"] = (phone[:2] + "****" + phone[-2:]) if len(phone) >= 4 else "****"
        logger.info("PayU S2S dynamic QR request", extra={"txnid": txnid, "payload": safe})

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
                    "PayU dynamic QR non-JSON response",
                    extra={"txnid": txnid, "status": response.status_code,
                           "body": response.text[:1000]},
                )
                raise UpstreamServiceError(
                    "PayU returned a non-JSON response (Dynamic QR may not be "
                    "enabled for this account).",
                    service="PayU",
                )

            meta = data.get("metaData", {}) or {}
            result = data.get("result", {}) or {}

            unmapped = (meta.get("unmappedStatus") or "").lower()
            # PayU exposes the QR deeplink under a few possible keys.
            qr_data = (
                result.get("qrString")
                or result.get("qrCodeData")
                or result.get("intentURIData")
                or ""
            )

            if unmapped == "failure" or meta.get("txnStatus") == "failed":
                msg = meta.get("message") or "PayU dynamic QR generation failed"
                logger.error("PayU dynamic QR failed", extra={"txnid": txnid, "meta": meta})
                raise UpstreamServiceError(f"PayU dynamic QR error: {msg}", service="PayU")

            if not qr_data:
                logger.error(
                    "PayU dynamic QR missing qrString",
                    extra={"txnid": txnid, "status": response.status_code,
                           "raw_response": str(data)[:1500]},
                )
                raise UpstreamServiceError(
                    "PayU did not return a QR string. Confirm Dynamic QR (DBQR) is "
                    "enabled for your merchant account and the server IP is whitelisted.",
                    service="PayU",
                )

            return {
                "qr_string": self._build_deeplink(qr_data),
                "txn_status": meta.get("txnStatus"),
                "unmapped_status": meta.get("unmappedStatus"),
                "payment_id": result.get("paymentId"),
                "reference_id": meta.get("referenceId"),
                "merchant_vpa": result.get("merchantVpa"),
                "merchant_name": result.get("merchantName"),
                "amount": result.get("amount", amount_str),
                "raw_response": data,
            }

        except httpx.TimeoutException:
            logger.error("PayU dynamic QR timeout", extra={"txnid": txnid})
            raise UpstreamTimeoutError()
        except httpx.RequestError as e:
            logger.error("PayU dynamic QR request error: %s", e, extra={"txnid": txnid})
            raise UpstreamServiceError("Failed to connect to PayU", service="PayU")


# Global service instance
payu_qr_service = PayUQRService()
