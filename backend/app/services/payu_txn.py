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

import logging
from typing import Any, Dict, Optional

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


# Global service instance
payu_txn_service = PayUTransactionService()
