"""
PayU Dynamic QR (S2S) Schemas — request/response for POST /v1/payu-qr

Generates a dynamic UPI QR string via PayU's `_payment` endpoint using
pg=DBQR / bankcode=UPIDBQR / txn_s2s_flow=4. The returned `qr_string` is a
`upi://pay?...` deeplink that can be rendered as a QR for offline collection.
"""

from pydantic import BaseModel, Field, model_validator
from typing import Optional, Dict, Any, List


class PayUQRCreate(BaseModel):
    """Schema for POST /v1/payu-qr/create"""

    amount: str = Field(..., description="Amount, e.g. '100.00'. Normalized server-side.")
    product_info: str = Field(..., min_length=1, max_length=100, alias="productinfo")
    first_name: str = Field(..., min_length=1, max_length=60, alias="firstname")
    email: str = Field(
        ...,
        pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
    )
    phone: str = Field(..., pattern=r"^\d{8,15}$")

    txnid: Optional[str] = Field(default=None, max_length=50)

    # Seconds until the QR expires (PayU `expiry_time`). Optional.
    expiry_time: Optional[int] = Field(
        default=None,
        ge=1,
        description="Validity of the QR in seconds (PayU expiry_time).",
    )

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
                "expiry_time": 900,
            }
        }


class PayUQRResponse(BaseModel):
    """Dynamic UPI QR string + transaction references."""

    status: str = "success"
    txnid: str
    qr_string: str = Field(
        ..., description="upi://pay?... deeplink (render as a QR for offline collection)"
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
                "qr_string": "upi://pay?pa=payu@hdfcbank&pn=Merchant&tr=4039...&am=100.00&cu=INR",
                "txn_status": "pending",
                "unmapped_status": "pending",
                "payment_id": "403993715535965242",
                "reference_id": "c99a6455b3e0dc5cd7167ab8c8cc10d2",
                "merchant_vpa": "payu@hdfcbank",
                "merchant_name": "Merchant",
                "amount": "100.00",
            }
        }


# ── Transaction management (postservice) — works for QR / Collect / Intent ──


class VerifyPaymentRequest(BaseModel):
    """Look up a QR/transaction status by merchant txnid (verify_payment)."""

    txnid: str = Field(..., min_length=1, description="Merchant transaction id used when generating the QR")

    class Config:
        json_schema_extra = {"example": {"txnid": "pay_a1b2c3d4e5f6"}}


class CheckPaymentRequest(BaseModel):
    """Look up a transaction by PayU id / mihpayid (check_payment)."""

    mihpayid: str = Field(..., min_length=1, description="PayU transaction id (mihpayid)")

    class Config:
        json_schema_extra = {"example": {"mihpayid": "403993715535965242"}}


class RefundRequest(BaseModel):
    """Initiate a full/partial refund (cancel_refund_transaction)."""

    mihpayid: str = Field(..., min_length=1, description="PayU transaction id to refund")
    token_id: str = Field(
        ..., min_length=1, max_length=50,
        description="Unique merchant refund reference (idempotency token)",
    )
    amount: str = Field(..., description="Refund amount (full or partial), e.g. '100.00'")

    class Config:
        json_schema_extra = {
            "example": {
                "mihpayid": "403993715535965242",
                "token_id": "refund_001",
                "amount": "100.00",
            }
        }


class RefundStatusRequest(BaseModel):
    """Check refund/cancel request status (check_action_status)."""

    mihpayid: str = Field(..., min_length=1, description="PayU transaction id the refund was raised against")
    request_id: Optional[str] = Field(default=None, description="Optional refund request id to narrow the lookup")

    class Config:
        json_schema_extra = {
            "example": {"mihpayid": "403993715535965242", "request_id": "123456"}
        }


class OfflineIntentLinkRequest(BaseModel):
    """Generate a UPI intent payment link (generate_upi_intent). Extra
    optional PayU var1 fields (txnNote, gst, refUrl, etc.) are passed through."""

    transactionId: str = Field(..., max_length=40, description="Unique merchant transaction id")
    transactionAmount: str = Field(..., description="Amount (>= 1.00), e.g. '100.00'")
    merchantVpa: Optional[str] = Field(default=None, description="Collecting VPA (defaults to key's VPA)")
    expiryTime: Optional[int] = Field(default=None, description="Link validity in seconds")
    txnNote: Optional[str] = Field(default=None)
    name: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None)

    class Config:
        extra = "allow"
        json_schema_extra = {
            "example": {"transactionId": "intent_001", "transactionAmount": "100.00", "expiryTime": 3600}
        }


class ExpireIntentLinkRequest(BaseModel):
    """Expire one or more UPI intent links (expire_intent_link)."""

    transaction_ids: List[str] = Field(..., min_items=1, max_items=100, description="Transaction ids to expire (max 100)")

    class Config:
        json_schema_extra = {"example": {"transaction_ids": ["intent_001", "intent_002"]}}


class InstaStaticQRRequest(BaseModel):
    """Generate/regenerate an Insta static UPI/Bharat QR (generate_insta_account).
    Extra PayU var1 fields are passed through."""

    merchantVpa: Optional[str] = Field(default=None, description="VPA to associate with the static QR")
    name: Optional[str] = Field(default=None, description="Merchant/business name")
    qrType: str = Field(default="upi", description="QR type: upi or bharatqr")
    instaProduct: str = Field(default="qr", description="Insta product, e.g. 'qr'")
    outputType: str = Field(default="string", description="string | base64 | image")
    regenerate: bool = Field(default=False, description="Regenerate an existing QR (sets getAccount=1)")

    class Config:
        extra = "allow"
        json_schema_extra = {
            "example": {
                "merchantVpa": "yourqr.merchant@indus",
                "name": "Acme Store",
                "qrType": "upi",
                "city": "Gurgaon",
                "pinCode": "122002",
                "address": "Sector 46",
                "instaProduct": "qr",
                "outputType": "string",
            }
        }


class DeactivateVpaRequest(BaseModel):
    """Deactivate an Insta VPA / static QR (expire_insta_account)."""

    merchantVpa: str = Field(..., description="VPA to deactivate")
    instaProduct: str = Field(default="qr", description="Insta product, e.g. 'qr'")

    class Config:
        json_schema_extra = {"example": {"merchantVpa": "yourqr.merchant@indus", "instaProduct": "qr"}}


class IntegratedStaticBharatQRRequest(BaseModel):
    """Generate an integrated static Bharat QR (generate_dynamic_bharat_qr).
    Extra PayU var1 fields are passed through."""

    transactionId: str = Field(..., max_length=40)
    transactionAmount: str = Field(..., description="Amount (>= 1.00)")
    merchantVpa: Optional[str] = Field(default=None)
    expiryTime: Optional[int] = Field(default=None)
    outputType: str = Field(default="string", description="string | base64 | image")

    class Config:
        extra = "allow"
        json_schema_extra = {
            "example": {
                "transactionId": "bqr_001",
                "transactionAmount": "100.00",
                "merchantVpa": "yourqr.merchant@indus",
                "expiryTime": 3600,
                "qrName": "Acme",
                "qrCity": "Gurgaon",
                "qrPinCode": "122001",
                "outputType": "string",
            }
        }


class PrintInvoiceQRRequest(BaseModel):
    """Generate an invoice QR (generate_invoice_qr). Extra PayU var1 fields
    (gst, invoiceNo, etc.) are passed through."""

    transactionId: str = Field(..., max_length=40)
    transactionAmount: str = Field(..., description="Amount (>= 1.00)")
    merchantVpa: Optional[str] = Field(default=None)
    expiryTime: Optional[int] = Field(default=None)
    outputType: str = Field(default="string", description="string | base64 | image")

    class Config:
        extra = "allow"
        json_schema_extra = {
            "example": {"transactionId": "inv_001", "transactionAmount": "100.00", "outputType": "string"}
        }


class SendInvoiceSmsRequest(BaseModel):
    """Send an invoice QR to a customer via SMS (send_sdk_message)."""

    payu_id: str = Field(..., description="PayU id / invoice reference returned by PayU")
    phone: str = Field(..., pattern=r"^\d{8,15}$", description="Customer mobile number")

    class Config:
        json_schema_extra = {"example": {"payu_id": "13863413996", "phone": "9833208174"}}


class QRTransactionStatusRequest(BaseModel):
    """Check a QR/Bharat QR transaction status (check_bqr_txn_status)."""

    transactionId: str = Field(..., description="Merchant transaction id to check")
    paymentmode: Optional[str] = Field(default=None, description="CARD | UPI")
    producttype: Optional[str] = Field(default=None, description="DBQR | ISBQR")

    class Config:
        json_schema_extra = {"example": {"transactionId": "bqr_001", "paymentmode": "UPI", "producttype": "DBQR"}}


class CancelQRTransactionRequest(BaseModel):
    """Cancel an in-progress QR transaction (cancel_qr_payment)."""

    transactionId: str = Field(..., max_length=40)
    product_type: Optional[str] = Field(default=None, description="e.g. DBQR")

    class Config:
        json_schema_extra = {"example": {"transactionId": "bqr_001", "product_type": "DBQR"}}


class BharatQRPaymentInitRequest(BaseModel):
    """Initiate a payment on an integrated static Bharat QR terminal (/QrPayment)."""

    qr_id: str = Field(..., description="Unique reference id embedded in the QR")
    amount: str = Field(..., description="Amount, e.g. '100.00'")
    product_info: str = Field(..., min_length=1, max_length=100, alias="productinfo")
    first_name: str = Field(..., min_length=1, max_length=60, alias="firstname")
    email: str = Field(..., pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    phone: str = Field(..., pattern=r"^\d{8,15}$")
    last_name: str = Field(default="", alias="lastname")
    txnid: Optional[str] = Field(default=None, max_length=40)
    expiry_time: Optional[int] = Field(default=None, description="Transaction expiry in seconds")
    udf3: str = Field(default="")
    udf4: str = Field(default="")
    udf5: str = Field(default="")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "qr_id": "qr123",
                "amount": "100.00",
                "productinfo": "Order #1234",
                "firstname": "John",
                "email": "john@example.com",
                "phone": "9999999999",
                "expiry_time": 3600,
            }
        }


class PayUTransactionResponse(BaseModel):
    """
    PayU postservice/QR response wrapper.

    The top-level ``status`` reflects PayU's actual outcome (derived from the
    raw response), so a business rejection from PayU surfaces as
    ``status: "failed"`` along with ``message`` and ``error_code``.
    """

    status: str = "success"
    command: str = Field(..., description="The PayU command that was executed")
    message: Optional[str] = Field(default=None, description="PayU's message, if any")
    error_code: Optional[str] = Field(default=None, description="PayU's error code, if any")
    response: Dict[str, Any] = Field(..., description="PayU's raw JSON response")

    @model_validator(mode="after")
    def _derive_outcome(self):
        raw = self.response or {}
        raw_status = raw.get("status")

        failed = False
        if isinstance(raw_status, str):
            failed = raw_status.strip().lower() in {"failed", "failure", "error", "0"}
        elif isinstance(raw_status, (int, float)):
            failed = int(raw_status) == 0

        self.status = "failed" if failed else "success"
        self.message = raw.get("message") or raw.get("msg")
        self.error_code = raw.get("errorCode") or raw.get("error_code")
        return self

    class Config:
        json_schema_extra = {
            "example": {
                "status": "failed",
                "command": "generate_insta_account",
                "message": "isAggregator parameter not configured for the merchant",
                "error_code": "E2013",
                "response": {
                    "status": "failed",
                    "message": "isAggregator parameter not configured for the merchant",
                    "errorCode": "E2013",
                },
            }
        }
