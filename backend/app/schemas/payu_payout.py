"""
PayU Payouts Schemas — request/response models for /v1/payu-payout endpoints.
"""

from typing import Any, List, Optional

from pydantic import BaseModel, Field, model_validator

PaymentType = str  # IMPS | UPI | NEFT | RTGS


class TransferItem(BaseModel):
    """A single transfer in an Initiate Transfer request."""

    paymentType: PaymentType = Field(..., description="IMPS | UPI | NEFT | RTGS")
    amount: float = Field(..., gt=0, description="Amount to transfer, e.g. 1234.12")
    purpose: str = Field(..., min_length=1, description="Purpose of the transfer")
    merchantRefId: Optional[str] = Field(
        default=None, max_length=40, description="Unique merchant reference ID"
    )
    batchId: Optional[str] = Field(default=None)

    beneficiaryName: Optional[str] = Field(default=None)
    beneficiaryEmail: Optional[str] = Field(default=None)
    beneficiaryMobile: Optional[str] = Field(default=None)

    # Required for IMPS / NEFT / RTGS
    beneficiaryAccountNumber: Optional[str] = Field(default=None)
    beneficiaryIfscCode: Optional[str] = Field(default=None)

    # Required for UPI
    vpa: Optional[str] = Field(default=None)

    # Optional credit-card payout
    recipientCardNo: Optional[str] = Field(default=None)

    disableApprovalFlow: bool = Field(default=True)
    retry: bool = Field(default=False)

    @model_validator(mode="after")
    def _validate_by_type(self):
        ptype = (self.paymentType or "").upper()
        if ptype not in {"IMPS", "UPI", "NEFT", "RTGS"}:
            raise ValueError("paymentType must be one of IMPS, UPI, NEFT, RTGS")
        self.paymentType = ptype
        if ptype == "UPI":
            if not self.vpa:
                raise ValueError("vpa is required for UPI transfers")
        else:
            if not self.beneficiaryAccountNumber or not self.beneficiaryIfscCode:
                raise ValueError(
                    "beneficiaryAccountNumber and beneficiaryIfscCode are required "
                    "for IMPS/NEFT/RTGS transfers"
                )
        return self


class InitiateTransferRequest(BaseModel):
    """POST /v1/payu-payout/transfers"""

    transfers: List[TransferItem] = Field(..., min_length=1)


class CheckStatusRequest(BaseModel):
    """POST /v1/payu-payout/transfers/status"""

    merchantRefId: Optional[str] = None
    batchId: Optional[str] = None
    transferStatus: Optional[str] = Field(
        default=None, description="QUEUED | IN_PROGRESS | PENDING | FAILED | SUCCESS"
    )
    date_from: Optional[str] = Field(default=None, alias="from", description="DD/MM/YYYY")
    date_to: Optional[str] = Field(default=None, alias="to", description="DD/MM/YYYY")
    page: int = Field(default=1, ge=1)
    pageSize: int = Field(default=100, ge=1, le=1000)

    model_config = {"populate_by_name": True}


class CancelTransferRequest(BaseModel):
    """POST /v1/payu-payout/transfers/cancel"""

    merchantRefId: str = Field(..., description="Reference ID of the queued transfer")


class DisableQueuedRequest(BaseModel):
    """POST /v1/payu-payout/queue-flag"""

    queueTxn: bool = Field(..., description="Whether to keep queueing on low balance")
    configMerchantId: Optional[str] = Field(default=None)


class VerifyAccountRequest(BaseModel):
    """POST /v1/payu-payout/verify-account"""

    accountNumber: str
    ifscCode: str
    merchantRefId: str
    beneName: Optional[str] = None
    validateIfsc: bool = True
    nameMatching: bool = False
    purpose: Optional[str] = None
    amount: Optional[int] = None


class CreateSmartSendRequest(BaseModel):
    """POST /v1/payu-payout/smart-send"""

    amount: str = Field(..., description="Payout amount, e.g. '100.00'")
    merchantRefId: str = Field(..., description="Unique reference ID for the link")
    custName: Optional[str] = None
    description: Optional[str] = None
    custMobile: Optional[str] = None
    custEmail: Optional[str] = None
    expiryDate: Optional[str] = Field(
        default=None, description="yyyy-MM-dd'T'HH:mm:ss.000Z (default 7 days)"
    )

    @model_validator(mode="after")
    def _require_contact(self):
        if not self.custMobile and not self.custEmail:
            raise ValueError("Either custMobile or custEmail is required")
        return self


class PayoutResponse(BaseModel):
    """Generic passthrough wrapper around PayU's status/msg/code/data envelope."""

    status: Optional[int] = None
    msg: Optional[str] = None
    code: Optional[Any] = None
    data: Optional[Any] = None
