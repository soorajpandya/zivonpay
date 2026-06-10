"""
PayU Collect Payment Schemas — Merchant Hosted Checkout

Request/response models for building a signed PayU _payment request that the
customer's browser submits to PayU (so PayU can handle 3-D Secure / bank
redirects). The salt and plain hash string are never returned to the client.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict


class CollectPaymentRequest(BaseModel):
    """Schema for POST /v1/payu/collect"""

    amount: str = Field(
        ...,
        description="Transaction amount, e.g. '100.00'. Normalized server-side.",
    )
    product_info: str = Field(..., min_length=1, max_length=255, alias="productinfo")
    first_name: str = Field(..., min_length=1, max_length=60, alias="firstname")
    email: str = Field(
        ...,
        pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
    )
    phone: str = Field(..., pattern=r"^\d{8,15}$")

    surl: Optional[str] = Field(
        default=None, description="Success callback URL (defaults to PAYU_SURL)"
    )
    furl: Optional[str] = Field(
        default=None, description="Failure callback URL (defaults to PAYU_FURL)"
    )

    # Optional unique txn id; auto-generated if omitted.
    txnid: Optional[str] = Field(default=None, max_length=25)

    # Recommended for fraud/chargeback handling.
    address1: Optional[str] = Field(default=None, max_length=100)

    # User-defined fields (included in the hash).
    udf1: str = Field(default="")
    udf2: str = Field(default="")
    udf3: str = Field(default="")
    udf4: str = Field(default="")
    udf5: str = Field(default="")

    # Merchant-hosted instrument routing (NOT part of the hash).
    # e.g. pg="UPI", bankcode="UPI"/"INTENT", vpa="user@bank"
    pg: Optional[str] = Field(default=None, description="Payment category, e.g. UPI, CC, NB")
    bankcode: Optional[str] = Field(default=None, description="Bank/instrument code")
    vpa: Optional[str] = Field(default=None, description="UPI VPA for UPI collect")

    @validator("txnid")
    def strip_txnid(cls, v):
        return v.strip() if v else v

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "amount": "100.00",
                "productinfo": "Order #1234",
                "firstname": "John",
                "email": "john@example.com",
                "phone": "9999999999",
                "surl": "https://yourapp.com/payu/success",
                "furl": "https://yourapp.com/payu/failure",
                "address1": "221B Baker Street",
                "pg": "UPI",
                "bankcode": "UPI",
                "vpa": "john@upi",
            }
        }


class CollectPaymentResponse(BaseModel):
    """Signed PayU request ready to be POSTed to PayU by the browser."""

    status: str = "success"
    txnid: str
    action_url: str = Field(..., description="PayU _payment endpoint to POST to")
    fields: Dict[str, str] = Field(..., description="Form fields including the hash")
    form_html: str = Field(..., description="Self-submitting HTML form")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "txnid": "pay_a1b2c3d4e5f6",
                "action_url": "https://secure.payu.in/_payment",
                "fields": {
                    "key": "fXEwSZ",
                    "txnid": "pay_a1b2c3d4e5f6",
                    "amount": "100.00",
                    "productinfo": "Order #1234",
                    "firstname": "John",
                    "email": "john@example.com",
                    "phone": "9999999999",
                    "surl": "https://yourapp.com/payu/success",
                    "furl": "https://yourapp.com/payu/failure",
                    "hash": "<sha512>",
                },
                "form_html": "<!DOCTYPE html>...",
            }
        }
