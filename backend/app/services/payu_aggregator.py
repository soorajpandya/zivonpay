"""
PayU Aggregator / Marketplace Settlement Solution Service

Handles child-merchant onboarding for the aggregator (marketplace) model:

  - OAuth client token from PayU's Hub (client_credentials grant) with the
    appropriate scope (refer_child_merchant / fetch_child_merchants),
    cached per-scope in memory.
  - Create Child Merchant            (POST /api/v3/product_accounts)
  - Update Bank Details              (PUT  /api/v3/product_accounts/{uuid})
  - Fetch Child Merchants / Sub Account Listing
                                     (GET  /api/v1/merchants/{uuid}/sub_accounts)

Split-settlement transaction commands (payment_split, release_settlement,
get_aggregator_transactions) reuse the postservice host and are implemented in
``app.services.payu_txn`` (they sign with the regular merchant key/salt).

Auth (Hub):     https://accounts.payu.in/oauth/token            (prod)
                https://uat-accounts.payu.in/oauth/token        (test)
Onboarding:     https://onboarding.payu.in                      (prod)
                https://uat-onepayuonboarding.payu.in           (test)

Reference: https://docs.payu.in/reference/get-client-token-api
"""

import logging
import time
from typing import Any, Dict, Optional

import httpx

from app.config import settings
from app.core.exceptions import UpstreamServiceError, UpstreamTimeoutError

logger = logging.getLogger(__name__)

SCOPE_REFER = "refer_child_merchant"
SCOPE_FETCH = "fetch_child_merchants"

# Hub (OAuth) hosts.
_HUB_BASE = {
    "test": "https://uat-accounts.payu.in",
    "production": "https://accounts.payu.in",
}
# Onboarding hosts.
_ONBOARDING_BASE = {
    "test": "https://uat-onepayuonboarding.payu.in",
    "production": "https://onboarding.payu.in",
}


class PayUAggregatorService:
    """Client for PayU Aggregator child-merchant onboarding APIs."""

    def __init__(self):
        self.env = settings.PAYU_AGG_ENVIRONMENT
        self.client_id = settings.PAYU_AGG_CLIENT_ID
        self.client_secret = settings.PAYU_AGG_CLIENT_SECRET
        self.parent_mid = settings.PAYU_AGG_PARENT_MID
        self.parent_uuid = settings.PAYU_AGG_PARENT_UUID
        self.timeout = settings.PAYU_AGG_TIMEOUT

        self.hub_base = _HUB_BASE[self.env]
        self.onboarding_base = _ONBOARDING_BASE[self.env]

        # Token cache per-scope: {scope: (token, expiry_epoch)}.
        self._tokens: Dict[str, tuple] = {}

    # ── Auth ─────────────────────────────────────────────────────────────────

    def _ensure_configured(self):
        if not self.client_id or not self.client_secret:
            raise RuntimeError(
                "PayU Aggregator not configured (PAYU_AGG_CLIENT_ID / "
                "PAYU_AGG_CLIENT_SECRET)"
            )

    async def get_client_token(
        self, scope: str = SCOPE_REFER, force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Get a Hub OAuth client token for the given scope.

        Returns the raw token payload (access_token, token_type, expires_in,
        scope, created_at). The access_token is cached per-scope until ~60s
        before expiry.
        """
        self._ensure_configured()

        now = time.time()
        cached = self._tokens.get(scope)
        if not force_refresh and cached and now < cached[1] - 60:
            return {
                "access_token": cached[0],
                "token_type": "Bearer",
                "scope": scope,
                "cached": True,
            }

        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "client_credentials",
            "scope": scope,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        url = f"{self.hub_base}/oauth/token"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(url, data=data, headers=headers)
        except httpx.TimeoutException:
            raise UpstreamTimeoutError()
        except httpx.RequestError as e:
            logger.error("PayU aggregator token request error: %s", e)
            raise UpstreamServiceError(
                "Failed to connect to PayU Hub auth", service="PayUAggregator"
            )

        try:
            payload = resp.json()
        except ValueError:
            logger.error("PayU aggregator token non-JSON: %s", resp.text[:500])
            raise UpstreamServiceError(
                "Invalid token response from PayU Hub", service="PayUAggregator"
            )

        token = payload.get("access_token")
        if not token:
            logger.error("PayU aggregator token error: %s", payload)
            raise UpstreamServiceError(
                f"PayU Hub auth failed: "
                f"{payload.get('error_description') or payload.get('error') or 'no access_token'}",
                service="PayUAggregator",
            )

        self._tokens[scope] = (token, now + int(payload.get("expires_in", 3600)))
        logger.info(
            "PayU aggregator token acquired",
            extra={"scope": scope, "expires_in": payload.get("expires_in")},
        )
        return payload

    async def _bearer(self, scope: str) -> str:
        payload = await self.get_client_token(scope)
        return payload["access_token"]

    # ── Generic onboarding request helper ─────────────────────────────────────

    async def _request(
        self,
        method: str,
        url: str,
        *,
        scope: str,
        json_body: Optional[Any] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Make a Bearer-authenticated onboarding request and return parsed JSON."""
        token = await self._bearer(scope)
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.request(method, url, json=json_body, params=params, headers=headers)
        except httpx.TimeoutException:
            raise UpstreamTimeoutError()
        except httpx.RequestError as e:
            logger.error("PayU aggregator request error (%s %s): %s", method, url, e)
            raise UpstreamServiceError(
                "Failed to connect to PayU Onboarding", service="PayUAggregator"
            )

        try:
            return resp.json()
        except ValueError:
            logger.error(
                "PayU aggregator non-JSON response (%s): %s",
                resp.status_code,
                resp.text[:500],
            )
            raise UpstreamServiceError(
                "Invalid response from PayU Onboarding", service="PayUAggregator"
            )

    # ── Child merchant onboarding ─────────────────────────────────────────────

    async def create_child_merchant(self, product_account: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create (onboard) a child merchant under the parent/aggregator MID.

        ``product_account`` is the inner object posted as
        ``{"product_account": {...}}``. ``aggregator_parent_mid`` defaults to the
        configured parent MID when not supplied.
        """
        body = dict(product_account)
        if not body.get("aggregator_parent_mid") and self.parent_mid:
            body["aggregator_parent_mid"] = self.parent_mid
        url = f"{self.onboarding_base}/api/v3/product_accounts"
        logger.info(
            "PayU aggregator create child merchant",
            extra={"parent_mid": body.get("aggregator_parent_mid")},
        )
        return await self._request(
            "POST", url, scope=SCOPE_REFER, json_body={"product_account": body}
        )

    async def update_bank_details(
        self, *, product_account_uuid: str, bank_detail: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update a child merchant's bank account (settlement) details.

        ``bank_detail`` must include bank_account_number, ifsc_code, holder_name.
        """
        url = f"{self.onboarding_base}/api/v3/product_accounts/{product_account_uuid}"
        logger.info(
            "PayU aggregator update bank details",
            extra={"uuid": product_account_uuid},
        )
        return await self._request(
            "PUT",
            url,
            scope=SCOPE_REFER,
            json_body={"product_account": {"bank_detail": bank_detail}},
        )

    async def update_sub_account(
        self, *, product_account_uuid: str, fields: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update arbitrary child-merchant (sub-account) details via the same
        ``PUT /api/v3/product_accounts/{uuid}`` endpoint used for bank details.

        ``fields`` is the inner ``product_account`` object (e.g. name, email,
        mobile, bank_detail, business_* fields).
        """
        url = f"{self.onboarding_base}/api/v3/product_accounts/{product_account_uuid}"
        logger.info(
            "PayU aggregator update sub-account",
            extra={"uuid": product_account_uuid, "fields": list(fields.keys())},
        )
        return await self._request(
            "PUT", url, scope=SCOPE_REFER, json_body={"product_account": fields}
        )

    async def list_sub_accounts(self, parent_uuid: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch all child merchants (sub accounts) linked to the parent merchant
        (v1 endpoint).

        Uses the configured parent UUID when ``parent_uuid`` is not provided.
        """
        uuid = parent_uuid or self.parent_uuid
        if not uuid:
            raise RuntimeError(
                "Parent merchant UUID not configured (PAYU_AGG_PARENT_UUID) and "
                "none provided"
            )
        url = f"{self.onboarding_base}/api/v1/merchants/{uuid}/sub_accounts"
        return await self._request("GET", url, scope=SCOPE_FETCH)

    async def list_sub_accounts_v3(
        self,
        identifier: Optional[str] = None,
        *,
        search_term: Optional[str] = None,
        search_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fetch child merchants via the Sub Account Listing API v3, with optional
        search.

        Args:
            identifier: Parent merchant MID/UUID in the path (defaults to the
                configured parent UUID, then parent MID).
            search_term: One of identifier, phone, email, name, brand_name,
                merchant_defined_identifier.
            search_text: The text to search for (used with search_term).
        """
        ident = identifier or self.parent_uuid or self.parent_mid
        if not ident:
            raise RuntimeError(
                "Parent merchant UUID/MID not configured "
                "(PAYU_AGG_PARENT_UUID / PAYU_AGG_PARENT_MID) and none provided"
            )
        url = f"{self.onboarding_base}/api/v3/product_accounts/{ident}/sub_accounts"
        params = {}
        if search_term:
            params["search_term"] = search_term
        if search_text:
            params["search_text"] = search_text
        return await self._request("GET", url, scope=SCOPE_FETCH, params=params or None)


# Global service instance
payu_aggregator_service = PayUAggregatorService()
