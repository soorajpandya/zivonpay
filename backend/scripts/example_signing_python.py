"""
ZivonPay — Client-Side Request Signing Example (Python)

When your merchant account has `enforce_request_signing` enabled,
every API request must include:
  - x-timestamp: Unix epoch (seconds)
  - x-signature: HMAC-SHA256(signing_secret, canonical_string)

Canonical string format:
  METHOD\nPATH\nSHA256(body)\nTIMESTAMP
"""

import hashlib
import hmac
import json
import time

import requests

# ── Your credentials ──
KEY_ID = "zp_test_yourKeyId"
KEY_SECRET = "zp_test_yourKeySecret"
SIGNING_SECRET = "your_signing_secret_from_dashboard"
BASE_URL = "https://api.zivonpay.com"


def sign_request(method: str, path: str, body: bytes, timestamp: str) -> str:
    """
    Compute HMAC-SHA256 signature.

    Args:
        method:    HTTP method (GET, POST, etc.)
        path:      Request path (e.g., /v1/orders)
        body:      Raw request body bytes (b"" for GET)
        timestamp: Unix timestamp string

    Returns:
        Hex signature string
    """
    body_hash = hashlib.sha256(body).hexdigest()
    canonical = f"{method.upper()}\n{path}\n{body_hash}\n{timestamp}"

    return hmac.new(
        SIGNING_SECRET.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


# ─── Example: Create Order (POST) ───

def create_order():
    path = "/v1/orders"
    payload = {
        "amount": 50000,
        "currency": "INR",
        "receipt": "order_001",
        "customer": {
            "name": "Rahul Sharma",
            "mobile": "9876543210",
            "email": "rahul@example.com",
        },
    }

    body = json.dumps(payload).encode("utf-8")
    timestamp = str(int(time.time()))
    signature = sign_request("POST", path, body, timestamp)

    resp = requests.post(
        f"{BASE_URL}{path}",
        auth=(KEY_ID, KEY_SECRET),                    # HTTP Basic Auth
        headers={
            "Content-Type": "application/json",
            "x-timestamp": timestamp,                 # Required for signing
            "x-signature": signature,                 # HMAC signature
        },
        data=body,
    )

    print(f"Status: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
    return resp.json()


# ─── Example: List Orders (GET) ───

def list_orders():
    path = "/v1/orders"
    body = b""  # GET requests have empty body
    timestamp = str(int(time.time()))
    signature = sign_request("GET", path, body, timestamp)

    resp = requests.get(
        f"{BASE_URL}{path}",
        auth=(KEY_ID, KEY_SECRET),
        headers={
            "x-timestamp": timestamp,
            "x-signature": signature,
        },
        params={"skip": 0, "limit": 20},
    )

    print(f"Status: {resp.status_code}")
    print(json.dumps(resp.json(), indent=2))
    return resp.json()


if __name__ == "__main__":
    print("=== Create Order (with HMAC signing) ===")
    create_order()

    print("\n=== List Orders (with HMAC signing) ===")
    list_orders()
