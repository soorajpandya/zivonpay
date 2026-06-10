"""
PayU Payouts Service (separate product from collect/intent and SprintNXT)

Handles:
  - OAuth token generation (client_credentials) with in-memory caching
  - Initiate Transfer (IMPS/NEFT/RTGS/UPI)
  - Check Transfer Status
  - Cancel Transfer
  - Disable Queued Payouts
  - Verify Account (penny test) / Validate VPA
  - Get IFSC Details
  - Smart Send (create link / details)

Auth:   https://accounts.payu.in/oauth/token  (prod)
        https://uat-accounts.payu.in/oauth/token  (test)
Payout: https://payout.payumoney.com/payout  (prod)
        https://uatoneapi.payu.in/payout  (test)

Reference: https://docs.payu.in/reference/authentication-for-payouts
"""

import logging
import time
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.core.exceptions import UpstreamServiceError, UpstreamTimeoutError

logger = logging.getLogger(__name__)

PAYOUT_SCOPE = "create_payout_transactions"

# Environment-specific base URLs.
_AUTH_BASE = {
    "test": "https://uat-accounts.payu.in",
    "production": "https://accounts.payu.in",
}
_PAYOUT_BASE = {
    "test": "https://uatoneapi.payu.in/payout",
    "production": "https://payout.payumoney.com/payout",
}
# Bulk Smart Send file APIs use a different test host (staging); prod is the same.
_BULK_BASE = {
    "test": "https://staging.payu.in/payout",
    "production": "https://payout.payumoney.com/payout",
}
# Initiate Transfer path differs between environments (test exposes v2).
_PAYMENT_PATH = {
    "test": "/v2/payment",
    "production": "/payment",
}


class PayUPayoutService:
    """Client for PayU Payouts APIs with cached OAuth token."""

    def __init__(self):
        self.env = settings.PAYU_PAYOUT_ENVIRONMENT
        self.client_id = settings.PAYU_PAYOUT_CLIENT_ID
        self.client_secret = settings.PAYU_PAYOUT_CLIENT_SECRET
        self.payout_merchant_id = settings.PAYU_PAYOUT_MERCHANT_ID
        self.timeout = settings.PAYU_PAYOUT_TIMEOUT

        self.auth_base = _AUTH_BASE[self.env]
        self.payout_base = _PAYOUT_BASE[self.env]
        self.bulk_base = _BULK_BASE[self.env]
        self.payment_path = _PAYMENT_PATH[self.env]

        # Token cache (per-process).
        self._access_token: Optional[str] = None
        self._token_expiry: float = 0.0

    # ── Auth ─────────────────────────────────────────────────────────────────

    def _ensure_configured(self):
        if not self.client_id or not self.client_secret or not self.payout_merchant_id:
            raise RuntimeError(
                "PayU Payouts not configured (PAYU_PAYOUT_CLIENT_ID / "
                "PAYU_PAYOUT_CLIENT_SECRET / PAYU_PAYOUT_MERCHANT_ID)"
            )

    async def get_access_token(self, force_refresh: bool = False) -> str:
        """
        Return a valid OAuth access token, generating/caching as needed.

        Uses the client_credentials grant. Tokens are cached until ~60s before
        expiry to avoid races near the boundary.
        """
        self._ensure_configured()

        now = time.time()
        if not force_refresh and self._access_token and now < self._token_expiry - 60:
            return self._access_token

        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": PAYOUT_SCOPE,
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Cache-Control": "no-cache",
        }
        url = f"{self.auth_base}/oauth/token"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, data=data, headers=headers)
        except httpx.TimeoutException:
            raise UpstreamTimeoutError()
        except httpx.RequestError as e:
            logger.error("PayU payout token request error: %s", e)
            raise UpstreamServiceError("Failed to connect to PayU Payouts auth", service="PayUPayout")

        try:
            payload = resp.json()
        except ValueError:
            logger.error("PayU payout token non-JSON response: %s", resp.text[:500])
            raise UpstreamServiceError("Invalid token response from PayU Payouts", service="PayUPayout")

        token = payload.get("access_token")
        if not token:
            logger.error("PayU payout token error: %s", payload)
            raise UpstreamServiceError(
                f"PayU Payouts auth failed: {payload.get('error_description') or payload.get('error') or 'no access_token'}",
                service="PayUPayout",
            )

        self._access_token = token
        self._token_expiry = now + int(payload.get("expires_in", 3600))
        logger.info("PayU payout token acquired (expires_in=%s)", payload.get("expires_in"))
        return token

    # ── Generic request helper ───────────────────────────────────────────────

    async def _request(
        self,
        method: str,
        url: str,
        *,
        data: Optional[Dict[str, Any]] = None,
        json_body: Optional[Any] = None,
        params: Optional[Dict[str, Any]] = None,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Make an authenticated request to a Payouts endpoint and return parsed JSON."""
        self._ensure_configured()
        token = await self.get_access_token()

        headers = {
            "Authorization": f"Bearer {token}",
            "payoutMerchantId": str(self.payout_merchant_id),
            "pid": str(self.payout_merchant_id),
            "Cache-Control": "no-cache",
        }
        if json_body is not None:
            headers["Content-Type"] = "application/json"
        else:
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        if extra_headers:
            headers.update(extra_headers)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.request(
                    method, url, data=data, json=json_body, params=params, headers=headers
                )
        except httpx.TimeoutException:
            raise UpstreamTimeoutError()
        except httpx.RequestError as e:
            logger.error("PayU payout request error (%s %s): %s", method, url, e)
            raise UpstreamServiceError("Failed to connect to PayU Payouts", service="PayUPayout")

        try:
            return resp.json()
        except ValueError:
            logger.error("PayU payout non-JSON response (%s): %s", resp.status_code, resp.text[:500])
            raise UpstreamServiceError("Invalid response from PayU Payouts", service="PayUPayout")

    # ── Transfers ──────────────────────────────────────────────────────────────

    async def initiate_transfer(self, transfers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Initiate one or more transfers. `transfers` is a JSON array of transfer
        objects (IMPS/NEFT/RTGS need account+ifsc; UPI needs vpa).
        """
        url = f"{self.payout_base}{self.payment_path}"
        params = {"pid": self.payout_merchant_id}
        logger.info("PayU payout initiate transfer", extra={"count": len(transfers)})
        return await self._request("POST", url, json_body=transfers, params=params)

    async def check_status(
        self,
        *,
        transfer_status: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        page: int = 1,
        page_size: int = 100,
        merchant_ref_id: Optional[str] = None,
        batch_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Check transfer status (filter by merchantRefId/batchId/status/date)."""
        url = f"{self.payout_base}/payment/listTransactions"
        data = {
            "transferStatus": transfer_status or "",
            "from": date_from or "",
            "to": date_to or "",
            "page": page,
            "pageSize": page_size,
            "merchantRefId": merchant_ref_id or "",
            "batchId": batch_id or "",
        }
        return await self._request("POST", url, data=data)

    async def cancel_transfer(self, merchant_ref_id: str) -> Dict[str, Any]:
        """Cancel a transfer (only while QUEUED/SCHEDULED)."""
        url = f"{self.payout_base}/payment/cancel"
        return await self._request("POST", url, data={"merchantRefId": merchant_ref_id})

    async def disable_queued(self, queue_txn: bool, config_merchant_id: Optional[str] = None) -> Dict[str, Any]:
        """Mark queued transactions as failed when balance is insufficient."""
        url = f"{self.payout_base}/setQueueTxnFlag"
        data = {
            "queueTxn": str(queue_txn).lower(),
            "configMerchantId": config_merchant_id or self.payout_merchant_id,
        }
        return await self._request("POST", url, data=data)

    # ── Verification ────────────────────────────────────────────────────────────

    async def verify_account(
        self,
        *,
        account_number: str,
        ifsc_code: str,
        merchant_ref_id: str,
        bene_name: Optional[str] = None,
        validate_ifsc: bool = True,
        name_matching: bool = False,
        purpose: Optional[str] = None,
        amount: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Verify a bank account (penny test / name match)."""
        url = f"{self.payout_base}/payment/verifyAccount"
        params = {
            "accountNumber": account_number,
            "ifscCode": ifsc_code,
            "merchantRefId": merchant_ref_id,
            "validateIfsc": str(validate_ifsc).lower(),
            "nameMatching": str(name_matching).lower(),
        }
        if bene_name:
            params["beneName"] = bene_name
        if purpose:
            params["purpose"] = purpose
        if amount is not None:
            params["amount"] = amount
        return await self._request("POST", url, params=params)

    async def validate_vpa(self, vpa: str) -> Dict[str, Any]:
        """Validate a UPI VPA before initiating a UPI payout."""
        url = f"{self.payout_base}/merchant/validateVpa"
        return await self._request("POST", url, params={"vpa": vpa})

    async def get_ifsc_details(self, ifsc: str) -> Dict[str, Any]:
        """Fetch bank/branch details for an IFSC code."""
        url = f"{self.payout_base}/merchant/getIfscDetails"
        return await self._request("GET", url, params={"ifsc": ifsc})

    # ── Smart Send ───────────────────────────────────────────────────────────────

    async def create_smart_send(
        self,
        *,
        amount: str,
        merchant_ref_id: str,
        cust_name: Optional[str] = None,
        description: Optional[str] = None,
        cust_mobile: Optional[str] = None,
        cust_email: Optional[str] = None,
        expiry_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a Smart Send link (when bene bank/VPA is unknown)."""
        url = f"{self.payout_base}/v2/smartSend/link"
        body = {
            "amount": amount,
            "merchantRefId": merchant_ref_id,
            "custName": cust_name or "",
            "description": description or "",
            "custMobile": cust_mobile or "",
            "custEmail": cust_email or "",
            "expiryDate": expiry_date or "",
        }
        return await self._request("POST", url, json_body=body)

    async def smart_send_details(self, merchant_ref_id: str) -> Dict[str, Any]:
        """Fetch details/status of a Smart Send link."""
        url = f"{self.payout_base}/merchant/smartSend/details"
        params = {"payoutMerchantId": self.payout_merchant_id, "merchantRefId": merchant_ref_id}
        return await self._request("GET", url, params=params, extra_headers={"Content-Type": "application/json"})

    # ── Bulk Smart Send (file) ────────────────────────────────────────────────

    async def bulk_upload_transfers(
        self, *, file_bytes: bytes, filename: str, content_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload a .csv/.xlsx/.xls file of Smart Send transfers. Returns a fileId
        used by `bulk_process_file` / `bulk_upload_status`.
        """
        self._ensure_configured()
        token = await self.get_access_token()
        url = f"{self.bulk_base}/v2/smartSend/bulkUpload/transfers"
        headers = {
            "Authorization": f"Bearer {token}",
            "pid": str(self.payout_merchant_id),
            "mid": str(self.payout_merchant_id),
            "Accept": "application/json, text/plain, */*",
        }
        files = {"file": (filename, file_bytes, content_type or "application/octet-stream")}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, files=files, headers=headers)
        except httpx.TimeoutException:
            raise UpstreamTimeoutError()
        except httpx.RequestError as e:
            logger.error("PayU payout bulk upload error: %s", e)
            raise UpstreamServiceError("Failed to connect to PayU Payouts", service="PayUPayout")
        try:
            return resp.json()
        except ValueError:
            logger.error("PayU payout bulk upload non-JSON (%s): %s", resp.status_code, resp.text[:500])
            raise UpstreamServiceError("Invalid response from PayU Payouts", service="PayUPayout")

    async def bulk_process_file(self, file_id: str) -> Dict[str, Any]:
        """Process a previously uploaded bulk Smart Send file by fileId."""
        url = f"{self.bulk_base}/v2/smartSend/bulkUpload/transfers/{file_id}"
        return await self._request("PUT", url, extra_headers={"Content-Type": "application/json"})

    async def bulk_upload_status(self, file_id: str) -> Dict[str, Any]:
        """Get the status of an uploaded/processed bulk file by fileId."""
        url = f"{self.payout_base}/v2/bulkUpload/transfers/{file_id}"
        return await self._request("GET", url, extra_headers={"Content-Type": "application/json"})

    # ── Beneficiaries ────────────────────────────────────────────────────────

    async def get_beneficiary(self, beneficiary_id: str) -> Dict[str, Any]:
        """Fetch a registered beneficiary by ID."""
        url = f"{self.payout_base}/beneficiary"
        return await self._request("GET", url, params={"beneficiaryId": beneficiary_id})

    async def create_beneficiary(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Register a beneficiary (bank account and/or VPA) under the merchant."""
        url = f"{self.payout_base}/beneficiary"
        return await self._request("POST", url, json_body=body)

    # ── Webhooks ─────────────────────────────────────────────────────────────

    async def set_webhook(self, webhooks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Configure payout event webhooks (array of {webhook, values:{url, authorization}})."""
        url = f"{self.payout_base}/v2/webhook"
        return await self._request("POST", url, json_body=webhooks)


# Global service instance
payu_payout_service = PayUPayoutService()
