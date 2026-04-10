# ZivonPay Go SDK

Official Go SDK for ZivonPay Payment Aggregator.

## Installation

```bash
go get github.com/zivonpay/go-sdk
```

## Usage

```go
package main

import (
    "fmt"
    "log"
    "github.com/zivonpay/go-sdk"
)

func main() {
    // Initialize client
    client := zivonpay.NewClient(zivonpay.Config{
        KeyID:       "zp_test_xxxxx",
        KeySecret:   "your_secret_key",
        Environment: "sandbox", // or "production"
    })

    // Create order
    order, err := client.CreateOrder(zivonpay.OrderCreateRequest{
        Amount:   1000, // Amount in paise
        Currency: "INR",
        Receipt:  "order_123",
        Customer: zivonpay.CustomerInfo{
            Name:   "Rahul Sharma",
            Mobile: "8877664543",
        },
        Notes: map[string]interface{}{
            "description": "Payment for order",
        },
    }, "")

    if err != nil {
        log.Fatal(err)
    }

    fmt.Println("UPI Intent URL:", order.UPIIntentURL)

    // Fetch order
    order, err = client.FetchOrder(order.ID)
    if err != nil {
        log.Fatal(err)
    }

    // List orders
    orders, err := client.ListOrders(0, 10)
    if err != nil {
        log.Fatal(err)
    }
}
```

## Webhook Verification

```go
package main

import (
    "fmt"
    "io/ioutil"
    "net/http"
    "strconv"
    "github.com/zivonpay/go-sdk"
)

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    payload, _ := ioutil.ReadAll(r.Body)
    signature := r.Header.Get("X-ZivonPay-Signature")
    timestampStr := r.Header.Get("X-ZivonPay-Timestamp")
    timestamp, _ := strconv.ParseInt(timestampStr, 10, 64)

    isValid := zivonpay.VerifyWebhookSignature(
        string(payload),
        signature,
        timestamp,
        "your_webhook_secret",
        300,
    )

    if isValid {
        fmt.Println("Valid webhook!")
        w.WriteStatus(200)
    } else {
        w.WriteStatus(400)
    }
}
```

## License

MIT
