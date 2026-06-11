"""
PayU Aggregator / Marketplace Settlement Solution Schemas
Request/response models for /v1/payu-aggregator endpoints.

Covers child-merchant onboarding (create/update bank/list) and split
settlements (split after transaction, aggregator transaction info, release
settlement). Split-during-transaction is handled by the collect endpoint via
the optional ``split_request`` field on CollectPaymentRequest.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, model_validator


# ── Onboarding ──────────────────────────────────────────────────────────────


class ClientTokenRequest(BaseModel):
    """POST /v1/payu-aggregator/token — fetch a Hub client token."""

    scope: str = Field(
        default="refer_child_merchant",
        description="Hub scope: refer_child_merchant (onboarding) or fetch_child_merchants (listing)",
    )

    class Config:
        json_schema_extra = {"example": {"scope": "refer_child_merchant"}}


class CreateChildMerchantRequest(BaseModel):
    """
    POST /v1/payu-aggregator/child-merchants — onboard a child merchant.

    Extra PayU fields (business_category_id, business_sub_category_id,
    gst_number, monthly_expected_volume, business_name, etc.) are passed through.
    """

    product: str = Field(default="PayUbiz", description="Product, e.g. PayUbiz")
    name: str = Field(..., description="Display name of the child merchant")
    email: str = Field(..., description="Child merchant email")
    mobile: str = Field(..., description="Child merchant mobile number")
    merchant_type: str = Field(default="aggregator", description="Must be 'aggregator'")
    pancard_number: str = Field(..., description="PAN card number of the child merchant")
    pancard_name: str = Field(..., description="Name as per the PAN card")
    business_entity_id: int = Field(..., description="Business entity id (1-17, see PayU mapping)")
    aggregator_parent_mid: Optional[str] = Field(
        default=None, description="Parent/aggregator MID (defaults to configured PAYU_AGG_PARENT_MID)"
    )

    class Config:
        extra = "allow"
        json_schema_extra = {
            "example": {
                "product": "PayUbiz",
                "name": "Gauri Gupta",
                "email": "child.merchant@example.com",
                "mobile": "7310000001",
                "merchant_type": "aggregator",
                "pancard_number": "CZMPG3718G",
                "pancard_name": "GAURI GUPTA",
                "business_entity_id": 14,
                "business_category_id": 16,
                "business_sub_category_id": 128,
                "monthly_expected_volume": 60000,
                "business_name": "Gauri Gupta",
            }
        }


class BankDetail(BaseModel):
    bank_account_number: str = Field(..., description="Settlement bank account number")
    ifsc_code: str = Field(..., description="Bank IFSC code")
    holder_name: str = Field(..., description="Account holder name")


class UpdateBankDetailsRequest(BaseModel):
    """PUT /v1/payu-aggregator/child-merchants/{uuid}/bank-details"""

    bank_detail: BankDetail

    class Config:
        json_schema_extra = {
            "example": {
                "bank_detail": {
                    "bank_account_number": "123456789",
                    "ifsc_code": "SBIN0010650",
                    "holder_name": "ABC",
                }
            }
        }


# ── Split settlements ────────────────────────────────────────────────────────


class SplitSegment(BaseModel):
    """A single child merchant's share in a split."""

    aggregatorSubTxnId: str = Field(..., description="Unique sub-transaction id for this child")
    aggregatorSubAmt: str = Field(..., description="Amount (absolute) or percentage for this child")
    aggregatorCharges: Optional[str] = Field(
        default=None, description="Parent commission for this child's part (parent only, optional)"
    )

    class Config:
        extra = "allow"


class SplitAfterTransactionRequest(BaseModel):
    """
    POST /v1/payu-aggregator/split — split a captured transaction across
    child merchants (payment_split command).
    """

    payu_id: str = Field(..., description="PayU id (mihpayid) of the parent transaction to split")
    split_type: str = Field(default="absolute", description="'absolute' or 'percentage'")
    split_info: Dict[str, SplitSegment] = Field(
        ...,
        description="Map of child merchant key -> split segment. For 'absolute' the amounts must sum to the txn amount; for 'percentage' they must sum to 100.",
    )

    @model_validator(mode="after")
    def _validate_type(self):
        if self.split_type not in {"absolute", "percentage"}:
            raise ValueError("split_type must be 'absolute' or 'percentage'")
        if not self.split_info:
            raise ValueError("split_info must contain at least one child merchant")
        return self

    class Config:
        json_schema_extra = {
            "example": {
                "payu_id": "403993715525003544",
                "split_type": "absolute",
                "split_info": {
                    "imAJ7I": {"aggregatorSubTxnId": "Child101", "aggregatorSubAmt": "50"},
                    "qOoYIv": {"aggregatorSubTxnId": "Child202", "aggregatorSubAmt": "50"},
                },
            }
        }


class AggregatorTransactionsRequest(BaseModel):
    """
    POST /v1/payu-aggregator/transactions — fetch parent transactions and their
    split sub-transactions (get_aggregator_transactions command).
    """

    date_from: str = Field(..., description="Start datetime 'YYYY-MM-DD HH:MM'")
    date_to: str = Field(..., description="End datetime 'YYYY-MM-DD HH:MM'")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=100, ge=1, le=1000)

    class Config:
        json_schema_extra = {
            "example": {
                "date_from": "2026-06-01 00:00",
                "date_to": "2026-06-01 23:59",
                "page": 1,
                "page_size": 100,
            }
        }


class ReleaseSettlementRequest(BaseModel):
    """
    POST /v1/payu-aggregator/release-settlement — release a blocked child
    sub-payment so it settles (release_settlement command).
    """

    payu_id: str = Field(..., description="PayU id of the child sub-transaction to release")
    child_mid: str = Field(..., description="Child merchant id the sub-transaction belongs to")

    class Config:
        json_schema_extra = {
            "example": {"payu_id": "412345678912384152", "child_mid": "39032915"}
        }


# ── Responses ─────────────────────────────────────────────────────────────────


class AggregatorResponse(BaseModel):
    """Generic passthrough wrapper around PayU's raw onboarding/split response."""

    status: str = "success"
    response: Dict[str, Any] = Field(..., description="PayU's raw JSON response")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "response": {"status": 1, "msg": "Release request is accepted"},
            }
        }
