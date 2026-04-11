"""
SprintNXT UPI Integration Service
Handles all communication with SprintNXT UPI API
"""

import httpx
import logging
from typing import Dict, Any, Optional
from app.config import settings
from app.core.exceptions import (
    UpstreamServiceError,
    UpstreamTimeoutError,
    UpstreamInvalidResponseError
)

logger = logging.getLogger(__name__)


class SprintNXTService:
    """Service for interacting with SprintNXT UPI API"""
    
    def __init__(self):
        self.base_url = settings.SPRINTNXT_BASE_URL
        self.client_id = settings.SPRINTNXT_CLIENT_ID
        self.token = settings.SPRINTNXT_TOKEN
        self.api_id = settings.SPRINTNXT_API_ID
        self.bank_id = settings.SPRINTNXT_BANK_ID
        self.payee_vpa = settings.SPRINTNXT_PAYEE_VPA
        self.timeout = settings.SPRINTNXT_TIMEOUT
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for SprintNXT API requests"""
        return {
            "Client-id": self.client_id,
            "Token": self.token,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    async def create_upi_intent(
        self,
        amount: float,
        mobile: str,
        customer_name: str,
        transaction_reference: str,
        transaction_note: str,
        expiry_time: int = 10,  # minutes
        ref_url: str = "https://zivonpay.com"
    ) -> Dict[str, Any]:
        """
        Create UPI intent/QR for payment
        
        Args:
            amount: Amount in rupees
            mobile: Customer mobile number
            customer_name: Customer name
            transaction_reference: Unique transaction reference
            transaction_note: Transaction description
            expiry_time: Expiry time in minutes
            ref_url: Reference URL
            
        Returns:
            Dictionary with UPIRefID, intent_url, merchantId
            
        Raises:
            UpstreamServiceError: If API call fails
        """
        # Cap expiry time — SprintNXT limits max value
        capped_expiry = min(expiry_time, 15)

        payload = {
            "apiId": int(self.api_id),
            "bankId": int(self.bank_id),
            "amount": f"{amount:.2f}",
            "payeeVPA": self.payee_vpa,
            "mobile": mobile,
            "ExpiryTime": str(capped_expiry),
            "txnNote": transaction_note,
            "txnReferance": transaction_reference,  # Note: SprintNXT spelling
            "customer_name": customer_name,
            "refurl": ref_url
        }
        
        # Log safe payload (mask mobile, no auth headers)
        safe_payload = {k: v for k, v in payload.items()}
        safe_payload["mobile"] = mobile[:2] + "****" + mobile[-4:]
        logger.warning(f"SprintNXT request payload: {safe_payload}")
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.base_url,
                    json=payload,
                    headers=self._get_headers()
                )
                
                response_data = response.json()
                
                logger.warning(f"SprintNXT raw response: {response_data}")
                
                # Check response status
                if response_data.get("status") != True or response_data.get("status_code") != 200:
                    error_msg = response_data.get("message", "Unknown error from SprintNXT")
                    logger.error(
                        f"SprintNXT API error: {error_msg}",
                        extra={"response": response_data}
                    )
                    raise UpstreamServiceError(f"Payment gateway error: {error_msg}")
                
                # Extract details
                details = response_data.get("details", {})
                
                if not details.get("UPIRefID"):
                    logger.error("Missing UPIRefID in SprintNXT response")
                    raise UpstreamInvalidResponseError()
                
                return {
                    "upi_ref_id": details.get("UPIRefID"),
                    "intent_url": details.get("intent_url"),
                    "merchant_id": details.get("merchantId"),
                    "raw_response": response_data
                }
        
        except httpx.TimeoutException:
            logger.error(f"SprintNXT API timeout for ref: {transaction_reference}")
            raise UpstreamTimeoutError()
        
        except httpx.RequestError as e:
            logger.error(f"SprintNXT API request error: {e}")
            raise UpstreamServiceError(f"Failed to connect to payment gateway")
        
        except Exception as e:
            logger.exception(f"Unexpected error in SprintNXT API call")
            raise UpstreamServiceError(f"Payment gateway error: {str(e)}")
    
    async def check_transaction_status(
        self,
        transaction_id: str,
        api_id: str = "20247"
    ) -> Dict[str, Any]:
        """
        Check transaction status with SprintNXT
        
        Args:
            transaction_id: Transaction reference/ID
            api_id: API ID for status check (default: 20247)
            
        Returns:
            Dictionary with transaction status
            
        Raises:
            UpstreamServiceError: If API call fails
        """
        payload = {
            "apiId": api_id,
            "txnId": transaction_id,
            "bankId": self.bank_id
        }
        
        logger.info(
            f"Checking transaction status",
            extra={"transaction_id": transaction_id}
        )
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.base_url,
                    json=payload,
                    headers=self._get_headers()
                )
                
                response_data = response.json()
                
                logger.info(
                    f"Status check response",
                    extra={
                        "transaction_id": transaction_id,
                        "response": response_data
                    }
                )
                
                return response_data
        
        except httpx.TimeoutException:
            logger.error(f"Status check timeout for txn: {transaction_id}")
            raise UpstreamTimeoutError()
        
        except httpx.RequestError as e:
            logger.error(f"Status check request error: {e}")
            raise UpstreamServiceError(f"Failed to check payment status")
        
        except Exception as e:
            logger.exception(f"Unexpected error in status check")
            raise UpstreamServiceError(f"Status check error: {str(e)}")


# Global service instance
sprintnxt_service = SprintNXTService()
