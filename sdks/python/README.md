# ZivonPay Python SDK

Official Python SDK for ZivonPay Payment Aggregator.

## Installation

```bash
pip install zivonpay
```

## Usage

```python
from zivonpay import ZivonPay

# Initialize client
client = ZivonPay(
    key_id='zp_test_xxxxx',
    key_secret='your_secret_key',
    environment='sandbox'  # or 'production'
)

# Create order
order = client.create_order(
    amount=1000,  # Amount in paise
    receipt='order_123',
    customer={
        'name': 'Rahul Sharma',
        'mobile': '8877664543'
    },
    notes={
        'description': 'Payment for order'
    }
)

print('UPI Intent URL:', order['upi_intent_url'])

# Fetch order
order = client.fetch_order(order['id'])

# List orders
orders = client.list_orders(skip=0, limit=10)
```

## Webhook Verification

```python
from flask import Flask, request
from zivonpay import ZivonPay

app = Flask(__name__)

@app.route('/webhooks/zivonpay', methods=['POST'])
def webhook():
    payload = request.get_data(as_text=True)
    signature = request.headers.get('X-ZivonPay-Signature')
    timestamp = int(request.headers.get('X-ZivonPay-Timestamp'))
    
    is_valid = ZivonPay.verify_webhook_signature(
        payload=payload,
        signature=signature,
        timestamp=timestamp,
        secret='your_webhook_secret'
    )
    
    if is_valid:
        event = request.get_json()
        print('Webhook event:', event)
        return '', 200
    else:
        return 'Invalid signature', 400
```

## API Reference

See [documentation](https://docs.zivonpay.com) for complete API reference.

## License

MIT
