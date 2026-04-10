# ZivonPay PHP SDK

Official PHP SDK for ZivonPay Payment Aggregator.

## Installation

```bash
composer require zivonpay/php-sdk
```

## Usage

```php
<?php

require 'vendor/autoload.php';

use ZivonPay\ZivonPay;

// Initialize client
$zivonpay = new ZivonPay(
    'zp_test_xxxxx',
    'your_secret_key',
    'sandbox' // or 'production'
);

// Create order
$order = $zivonpay->createOrder([
    'amount' => 1000, // Amount in paise
    'currency' => 'INR',
    'receipt' => 'order_123',
    'customer' => [
        'name' => 'Rahul Sharma',
        'mobile' => '8877664543'
    ],
    'notes' => [
        'description' => 'Payment for order'
    ]
]);

echo 'UPI Intent URL: ' . $order['upi_intent_url'];

// Fetch order
$order = $zivonpay->fetchOrder($order['id']);

// List orders
$orders = $zivonpay->listOrders(0, 10);
```

## Webhook Verification

```php
<?php

// Webhook endpoint
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_ZIVONPAY_SIGNATURE'];
$timestamp = (int) $_SERVER['HTTP_X_ZIVONPAY_TIMESTAMP'];

$isValid = ZivonPay::verifyWebhookSignature(
    $payload,
    $signature,
    $timestamp,
    'your_webhook_secret'
);

if ($isValid) {
    $event = json_decode($payload, true);
    // Process webhook event
    http_response_code(200);
} else {
    http_response_code(400);
}
```

## License

MIT
