"""
ZivonPay Python SDK
Official SDK for ZivonPay Payment Aggregator
"""

import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
import hashlib
import hmac
import time
from typing import Dict, Any, Optional, List


class ZivonPayError(Exception):
    """Base exception for ZivonPay errors"""
    
    def __init__(self, error_data: Dict[str, Any]):
        self.code = error_data.get('code')
        self.description = error_data.get('description')
        self.source = error_data.get('source')
        self.step = error_data.get('step')
        self.reason = error_data.get('reason')
        self.metadata = error_data.get('metadata', {})
        super().__init__(self.description)


class ZivonPay:
    """ZivonPay API Client"""
    
    def __init__(
        self,
        key_id: str,
        key_secret: str,
        environment: str = 'sandbox',
        timeout: int = 30,
        max_retries: int = 3
    ):
        """
        Initialize ZivonPay client
        
        Args:
            key_id: API key ID (zp_test_xxx or zp_live_xxx)
            key_secret: API secret key
            environment: 'sandbox' or 'production'
            timeout: Request timeout in seconds
            max_retries: Maximum number of retries
        """
        self.key_id = key_id
        self.key_secret = key_secret
        self.environment = environment
        self.timeout = timeout
        
        # Determine base URL
        if environment == 'production':
            self.base_url = 'https://api.zivonpay.com/v1'
        else:
            self.base_url = 'https://sandbox.api.zivonpay.com/v1'
        
        # Configure session with retries
        self.session = requests.Session()
        self.session.auth = (key_id, key_secret)
        
        retry_strategy = Retry(
            total=max_retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            method_whitelist=["HEAD", "GET", "POST", "PUT", "DELETE", "OPTIONS", "TRACE"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)
    
    def _request(
        self,
        method: str,
        path: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make HTTP request"""
        url = f"{self.base_url}{path}"
        
        request_headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'ZivonPay-Python/1.0.0'
        }
        
        if headers:
            request_headers.update(headers)
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                params=params,
                headers=request_headers,
                timeout=self.timeout
            )
            
            # Check for errors
            if response.status_code >= 400:
                error_data = response.json().get('error', {})
                raise ZivonPayError(error_data)
            
            return response.json()
        
        except requests.exceptions.RequestException as e:
            raise ZivonPayError({
                'code': 'REQUEST_ERROR',
                'description': str(e),
                'source': 'sdk'
            })
    
    # Orders API
    def create_order(
        self,
        amount: int,
        receipt: str,
        customer: Dict[str, str],
        currency: str = 'INR',
        notes: Optional[Dict] = None,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new order
        
        Args:
            amount: Amount in paise (smallest currency unit)
            receipt: Merchant's order reference
            customer: Customer information dict with 'name', 'mobile', 'email' (optional)
            currency: Currency code (default: INR)
            notes: Additional notes
            idempotency_key: Optional idempotency key
            
        Returns:
            Order dict
        """
        data = {
            'amount': amount,
            'currency': currency,
            'receipt': receipt,
            'customer': customer,
            'notes': notes or {}
        }
        
        headers = {}
        if idempotency_key:
            headers['X-Idempotency-Key'] = idempotency_key
        
        return self._request('POST', '/orders', data=data, headers=headers)
    
    def fetch_order(self, order_id: str) -> Dict[str, Any]:
        """
        Fetch order by ID
        
        Args:
            order_id: Order UUID
            
        Returns:
            Order dict
        """
        return self._request('GET', f'/orders/{order_id}')
    
    def list_orders(self, skip: int = 0, limit: int = 10) -> Dict[str, Any]:
        """
        List orders
        
        Args:
            skip: Number of records to skip
            limit: Number of records to return
            
        Returns:
            Dict with 'entity', 'count', and 'data' keys
        """
        params = {'skip': skip, 'limit': limit}
        return self._request('GET', '/orders', params=params)
    
    # Payments API
    def fetch_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Fetch payment by ID
        
        Args:
            payment_id: Payment UUID
            
        Returns:
            Payment dict
        """
        return self._request('GET', f'/payments/{payment_id}')
    
    def list_payments(self, skip: int = 0, limit: int = 10) -> Dict[str, Any]:
        """
        List payments
        
        Args:
            skip: Number of records to skip
            limit: Number of records to return
            
        Returns:
            Dict with 'entity', 'count', and 'data' keys
        """
        params = {'skip': skip, 'limit': limit}
        return self._request('GET', '/payments', params=params)
    
    # Webhook verification
    @staticmethod
    def verify_webhook_signature(
        payload: str,
        signature: str,
        timestamp: int,
        secret: str,
        tolerance: int = 300
    ) -> bool:
        """
        Verify webhook signature
        
        Args:
            payload: Raw request body as string
            signature: Signature from X-ZivonPay-Signature header
            timestamp: Timestamp from X-ZivonPay-Timestamp header
            secret: Webhook secret
            tolerance: Time tolerance in seconds (default: 300)
            
        Returns:
            True if valid, False otherwise
        """
        # Check timestamp tolerance
        current_time = int(time.time())
        if abs(current_time - timestamp) > tolerance:
            return False
        
        # Create expected signature
        signed_payload = f"{timestamp}.{payload}"
        expected_signature = hmac.new(
            secret.encode(),
            signed_payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures (timing-safe)
        return hmac.compare_digest(signature, expected_signature)


# Export main class
__all__ = ['ZivonPay', 'ZivonPayError']
__version__ = '1.0.0'
