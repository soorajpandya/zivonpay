"""
PayU UPI Intent (S2S) Schemas — request/response for POST /v1/payu-intent
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class PayUIntentCreate(BaseModel):
    """Schema for POST /v1/payu-intent/create"""

    amount: str = Field(..., description="Amount, e.g. '100.00'. Normalized server-side.")
    product_info: str = Field(..., min_length=1, max_length=100, alias="productinfo")
    first_name: str = Field(..., min_length=1, max_length=60, alias="firstname")
    email: str = Field(
        ...,
        pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
    )
    phone: str = Field(..., pattern=r"^\d{8,15}$")

    txnid: Optional[str] = Field(default=None, max_length=50)

    # Generic INTENT (QR / app tray) or specific app code: TEZ, PHONEPE, PAYTM, ...
    bankcode: str = Field(default="INTENT")
    # For specific intent: phonepe/googlepay/paytm/bhim/cred/amazonpay/whatsapp.
    upi_app_name: Optional[str] = Field(default=None)

    # Customer device info (fraud/chargeback). If omitted, captured from request.
    s2s_client_ip: Optional[str] = Field(default=None)
    s2s_device_info: Optional[str] = Field(default=None)

    udf1: str = Field(default="")
    udf2: str = Field(default="")
    udf3: str = Field(default="")
    udf4: str = Field(default="")
    udf5: str = Field(default="")

    surl: Optional[str] = Field(default=None)
    furl: Optional[str] = Field(default=None)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "amount": "100.00",
                "productinfo": "Order #1234",
                "firstname": "John",
                "email": "john@example.com",
                "phone": "9033416131",
                "bankcode": "INTENT",
            }
        }


class PayUIntentResponse(BaseModel):
    """UPI intent deeplink + transaction references."""

    status: str = "success"
    txnid: str
    intent_url: str = Field(..., description="upi://pay?... deeplink (render as link/QR)")
    qr_code_data_uri: Optional[str] = Field(
        default=None, description="QR code of intent_url as a base64 PNG data URI"
    )
    txn_status: Optional[str] = None
    unmapped_status: Optional[str] = None
    payment_id: Optional[str] = None
    reference_id: Optional[str] = None
    merchant_vpa: Optional[str] = None
    merchant_name: Optional[str] = None
    amount: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "txnid": "pay_a1b2c3d4e5f6",
                "intent_url": "upi://pay?pa=payu@hdfcbank&pn=Merchant&tr=4039...&am=100.00&cu=INR",
                "txn_status": "pending",
                "unmapped_status": "pending",
                "payment_id": "403993715535965242",
                "reference_id": "c99a6455b3e0dc5cd7167ab8c8cc10d2",
                "merchant_vpa": "payu@hdfcbank",
                "merchant_name": "Merchant",
                "amount": "100.00",
            }
        }
