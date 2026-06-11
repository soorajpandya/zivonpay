"""
PayU Transaction Management (postservice) Service

Wraps PayU's command-based `postservice` APIs used to manage transactions
*after* a payment is initiated — works for any PayU collection flow (Collect,
UPI Intent, and Dynamic QR):

  - verify_payment            → status lookup by merchant txnid
  - check_payment             → status lookup by PayU id (mihpayid)
  - cancel_refund_transaction → initiate a full/partial refund (or cancel auth)
  - check_action_status       → refund/cancel request status

All requests are SHA-512 signed server-side using the command hash
(key|command|var1|salt). The salt is never exposed.

Reference: https://docs.payu.in/reference/verify_payment_api
"""

import json
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.core.exceptions import UpstreamServiceError, UpstreamTimeoutError
from app.services.payu import generate_command_hash, normalize_amount

logger = logging.getLogger(__name__)

# PayU postservice (info) endpoints — distinct from the _payment host.
PAYU_TEST_POSTSERVICE_URL = "https://test.payu.in/merchant/postservice.php?form=2"
PAYU_PROD_POSTSERVICE_URL = "https://info.payu.in/merchant/postservice.php?form=2"


def postservice_endpoint(environment: Optional[str] = None) -> str:
    """Return the correct postservice endpoint for the PayU environment."""
    if environment is None:
        environment = settings.PAYU_ENVIRONMENT
    return (
        PAYU_PROD_POSTSERVICE_URL
        if environment == "production"
        else PAYU_TEST_POSTSERVICE_URL
    )


class PayUTransactionService:
    """Client for PayU command-based transaction management APIs."""

    def __init__(self):
        self.endpoint = postservice_endpoint(settings.PAYU_ENVIRONMENT)
        self.key = settings.PAYU_MERCHANT_KEY
        self.salt = settings.PAYU_SALT
        self.timeout = settings.PAYU_TIMEOUT

    async def _run_command(
        self,
        *,
        command: str,
        var1: str,
        extra_vars: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Execute a PayU postservice command and return the parsed JSON.

        The command hash is computed as SHA-512 of `key|command|var1|salt`.
        Additional positional variables (var2, var3, ...) are posted as-is but
        are not part of the hash.

        Raises:
            RuntimeError: If PayU credentials are not configured.
            UpstreamServiceError / UpstreamTimeoutError
        """
        if not self.key or not self.salt:
            raise RuntimeError("PayU credentials are not configured (PAYU_MERCHANT_KEY/PAYU_SALT)")

        hash_value = generate_command_hash(self.key, command, var1, self.salt)

        payload = {
            "key": self.key,
            "command": command,
            "var1": var1,
            "hash": hash_value,
        }
        if extra_vars:
            payload.update(extra_vars)

        logger.info(
            "PayU postservice command",
            extra={"command": command, "var1": var1},
        )

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
                    "PayU postservice non-JSON response",
                    extra={"command": command, "status": response.status_code,
                           "body": response.text[:1000]},
                )
                raise UpstreamServiceError(
                    "PayU returned a non-JSON response for command "
                    f"'{command}'.",
                    service="PayU",
                )

            return data

        except httpx.TimeoutException:
            logger.error("PayU postservice timeout", extra={"command": command})
            raise UpstreamTimeoutError()
        except httpx.RequestError as e:
            logger.error("PayU postservice request error: %s", e, extra={"command": command})
            raise UpstreamServiceError("Failed to connect to PayU", service="PayU")

    async def verify_payment(self, txnid: str) -> Dict[str, Any]:
        """Look up a transaction by merchant txnid (verify_payment)."""
        return await self._run_command(command="verify_payment", var1=txnid)

    async def check_payment(self, mihpayid: str) -> Dict[str, Any]:
        """Look up a transaction by PayU id / mihpayid (check_payment)."""
        return await self._run_command(command="check_payment", var1=mihpayid)

    async def refund(
        self,
        *,
        mihpayid: str,
        token_id: str,
        amount,
    ) -> Dict[str, Any]:
        """
        Initiate a refund (or cancel an authorized transaction).

        Args:
            mihpayid: PayU transaction id to refund.
            token_id: Unique merchant refund reference (idempotency token).
            amount: Refund amount (full or partial), normalized to "0.00".
        """
        amount_str = normalize_amount(amount)
        return await self._run_command(
            command="cancel_refund_transaction",
            var1=mihpayid,
            extra_vars={"var2": token_id, "var3": amount_str},
        )

    async def refund_status(self, mihpayid: str, request_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Check the status of a refund/cancel request (check_action_status).

        Args:
            mihpayid: PayU transaction id the refund was raised against.
            request_id: Optional refund request id to narrow the lookup.
        """
        extra = {"var2": request_id} if request_id else None
        return await self._run_command(
            command="check_action_status",
            var1=mihpayid,
            extra_vars=extra,
        )

    # ── UPI QR API suite (postservice commands with a JSON var1) ──

    async def _run_json_command(
        self,
        *,
        command: str,
        var1_obj: Dict[str, Any],
        extra_vars: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """
        Execute a postservice command whose ``var1`` is a JSON object.

        The var1 JSON is serialized once and used for BOTH the hash and the
        posted body so they always match (PayU rejects mismatches).
        """
        var1 = json.dumps(var1_obj, separators=(",", ":"))
        return await self._run_command(command=command, var1=var1, extra_vars=extra_vars)

    async def generate_offline_intent_link(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a UPI intent payment link (generate_upi_intent)."""
        return await self._run_json_command(command="generate_upi_intent", var1_obj=details)

    async def expire_intent_link(self, transaction_ids: List[str]) -> Dict[str, Any]:
        """Expire one or more UPI intent links (expire_intent_link)."""
        return await self._run_json_command(
            command="expire_intent_link",
            var1_obj={"transactionIds": ",".join(transaction_ids)},
        )

    async def insta_static_qr(self, details: Dict[str, Any], *, regenerate: bool = False) -> Dict[str, Any]:
        """
        Generate (or regenerate) an Insta static UPI/Bharat QR
        (generate_insta_account). Pass regenerate=True to re-issue an
        existing QR (sets getAccount=1).
        """
        payload = dict(details)
        if regenerate:
            payload["getAccount"] = "1"
        return await self._run_json_command(command="generate_insta_account", var1_obj=payload)

    async def deactivate_vpa(self, merchant_vpa: str, insta_product: str = "qr") -> Dict[str, Any]:
        """Deactivate an Insta VPA / static QR (expire_insta_account)."""
        return await self._run_json_command(
            command="expire_insta_account",
            var1_obj={"merchantVpa": merchant_vpa, "instaProduct": insta_product},
        )

    async def integrated_static_bharat_qr(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """Generate an integrated static Bharat QR (generate_dynamic_bharat_qr)."""
        return await self._run_json_command(
            command="generate_dynamic_bharat_qr", var1_obj=details
        )

    async def print_invoice_qr(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """Generate an invoice QR (generate_invoice_qr)."""
        return await self._run_json_command(command="generate_invoice_qr", var1_obj=details)

    async def send_invoice_sms(self, payu_id: str, phone: str) -> Dict[str, Any]:
        """Send an invoice QR to a customer via SMS (send_sdk_message)."""
        return await self._run_command(
            command="send_sdk_message",
            var1=payu_id,
            extra_vars={"var2": phone},
        )

    async def check_qr_transaction_status(
        self,
        transaction_id: str,
        payment_mode: Optional[str] = None,
        product_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Check a QR/Bharat QR transaction status (check_bqr_txn_status)."""
        extra = {}
        if payment_mode:
            extra["var2"] = payment_mode
        if product_type:
            extra["var3"] = product_type
        return await self._run_command(
            command="check_bqr_txn_status",
            var1=transaction_id,
            extra_vars=extra or None,
        )

    async def cancel_qr_transaction(
        self,
        transaction_id: str,
        product_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Cancel an in-progress QR transaction (cancel_qr_payment)."""
        var1_obj: Dict[str, Any] = {"transactionId": transaction_id}
        if product_type:
            var1_obj["product_type"] = product_type
        return await self._run_json_command(command="cancel_qr_payment", var1_obj=var1_obj)

    # ── Aggregator / Marketplace split settlements (postservice commands) ──

    async def payment_split(
        self,
        *,
        payu_id: str,
        split_info: Dict[str, Any],
        split_type: str = "absolute",
    ) -> Dict[str, Any]:
        """
        Split a captured parent transaction across child merchants *after* the
        transaction (``payment_split`` command, api_version 7).

        Args:
            payu_id: PayU id (mihpayid) of the parent transaction to split.
            split_info: Map of child merchant key -> {aggregatorSubTxnId,
                aggregatorSubAmt, aggregatorCharges?}. For ``absolute`` the sum
                of aggregatorSubAmt must equal the transaction amount; for
                ``percentage`` the percentages must sum to 100.
            split_type: "absolute" or "percentage".
        """
        var1_obj = {
            "type": split_type,
            "payuId": payu_id,
            "splitInfo": split_info,
        }
        return await self._run_json_command(
            command="payment_split",
            var1_obj=var1_obj,
            extra_vars={"api_version": "7"},
        )

    async def get_aggregator_transactions(
        self,
        *,
        date_from: str,
        date_to: str,
        page: int = 1,
        page_size: int = 100,
    ) -> Dict[str, Any]:
        """
        Fetch parent/aggregator transaction info with their split sub-txns
        (``get_aggregator_transactions`` command).

        Args:
            date_from: Start datetime "YYYY-MM-DD HH:MM" (var1).
            date_to: End datetime "YYYY-MM-DD HH:MM" (var2).
            page: Page number (var3).
            page_size: Records per page (var4).

        Note: The hash is computed over key|command|var1|salt (var1 = date_from).
        """
        return await self._run_command(
            command="get_aggregator_transactions",
            var1=date_from,
            extra_vars={
                "var2": date_to,
                "var3": str(page),
                "var4": str(page_size),
                "var5": "",
            },
        )

    async def release_settlement(self, *, payu_id: str, child_mid: str) -> Dict[str, Any]:
        """
        Release a blocked child sub-payment so it settles to the child merchant
        (``release_settlement`` command).

        Args:
            payu_id: PayU id of the (child) sub-transaction to release (var1).
            child_mid: Child merchant id the sub-transaction belongs to (var2).
        """
        return await self._run_command(
            command="release_settlement",
            var1=payu_id,
            extra_vars={"var2": child_mid},
        )


# Global service instance
payu_txn_service = PayUTransactionService()
