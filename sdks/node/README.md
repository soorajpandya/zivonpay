# ZivonPay Node.js SDK

Official Node.js SDK for ZivonPay Payment Aggregator.

## Installation

```bash
npm install @zivonpay/node-sdk
```

## Usage

```typescript
import ZivonPay from '@zivonpay/node-sdk';

// Initialize client
const zivonpay = new ZivonPay({
  keyId: 'zp_test_xxxxx',
  keySecret: 'your_secret_key',
  environment: 'sandbox' // or 'production'
});

// Create order
const order = await zivonpay.orders.create({
  amount: 1000, // Amount in paise
  currency: 'INR',
  receipt: 'order_123',
  customer: {
    name: 'Rahul Sharma',
    mobile: '8877664543'
  },
  notes: {
    description: 'Payment for order'
  }
});

console.log('UPI Intent URL:', order.upi_intent_url);

// Fetch order
const fetchedOrder = await zivonpay.orders.fetch(order.id);

// List orders
const orders = await zivonpay.orders.list(0, 10);
```

## Payment Links

```typescript
// Create a hosted payment link
const intent = await zivonpay.paymentLinks.create({
  amount: 100000, // ₹1,000 in paise
  order_id: 'ORD_789',
  customer_name: 'Suraj Pandya',
  customer_phone: '9999999999',
  customer_email: 'suraj@example.com',
  expiry_minutes: 30
});

console.log('Payment Link:', intent.payment_link);
// Share this URL with your customer — they'll see a hosted checkout page with UPI QR

// Fetch payment link status
const link = await zivonpay.paymentLinks.fetch(intent.payment_intent_id);
console.log('Status:', link.intent_status);

// List all payment links
const links = await zivonpay.paymentLinks.list(0, 10);
```

## Webhook Verification

```typescript
import express from 'express';

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.post('/webhooks/zivonpay', (req, res) => {
  const signature = req.headers['x-zivonpay-signature'] as string;
  const timestamp = parseInt(req.headers['x-zivonpay-timestamp'] as string);
  const payload = req.body.toString();

  const isValid = zivonpay.verifyWebhookSignature(
    payload,
    signature,
    timestamp,
    'your_webhook_secret'
  );

  if (isValid) {
    const event = JSON.parse(payload);
    console.log('Webhook event:', event);
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
});
```

## API Reference

See [documentation](https://docs.zivonpay.com) for complete API reference.

## License

MIT
