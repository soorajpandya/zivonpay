// Package zivonpay provides the official Go SDK for ZivonPay Payment Aggregator
package zivonpay

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	sandboxBaseURL    = "https://sandbox.api.zivonpay.com/v1"
	productionBaseURL = "https://api.zivonpay.com/v1"
	defaultTimeout    = 30 * time.Second
)

// Client is the ZivonPay API client
type Client struct {
	keyID      string
	keySecret  string
	baseURL    string
	httpClient *http.Client
}

// Config holds the configuration for the client
type Config struct {
	KeyID       string
	KeySecret   string
	Environment string // "sandbox" or "production"
	Timeout     time.Duration
}

// NewClient creates a new ZivonPay client
func NewClient(config Config) *Client {
	baseURL := sandboxBaseURL
	if config.Environment == "production" {
		baseURL = productionBaseURL
	}

	timeout := config.Timeout
	if timeout == 0 {
		timeout = defaultTimeout
	}

	return &Client{
		keyID:     config.KeyID,
		keySecret: config.KeySecret,
		baseURL:   baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// CustomerInfo represents customer information
type CustomerInfo struct {
	Name   string `json:"name"`
	Mobile string `json:"mobile"`
	Email  string `json:"email,omitempty"`
}

// OrderCreateRequest represents order creation request
type OrderCreateRequest struct {
	Amount   int                    `json:"amount"`
	Currency string                 `json:"currency"`
	Receipt  string                 `json:"receipt"`
	Customer CustomerInfo           `json:"customer"`
	Notes    map[string]interface{} `json:"notes,omitempty"`
}

// Order represents an order
type Order struct {
	ID           string                 `json:"id"`
	Entity       string                 `json:"entity"`
	Amount       int                    `json:"amount"`
	Currency     string                 `json:"currency"`
	Status       string                 `json:"status"`
	Receipt      string                 `json:"receipt"`
	UPIIntentURL string                 `json:"upi_intent_url,omitempty"`
	QRCodeURL    string                 `json:"qr_code_url,omitempty"`
	Notes        map[string]interface{} `json:"notes"`
	CreatedAt    int64                  `json:"created_at"`
	ExpiresAt    int64                  `json:"expires_at,omitempty"`
	PaidAt       int64                  `json:"paid_at,omitempty"`
}

// Payment represents a payment
type Payment struct {
	ID               string `json:"id"`
	Entity           string `json:"entity"`
	OrderID          string `json:"order_id"`
	Amount           int    `json:"amount"`
	Currency         string `json:"currency"`
	Status           string `json:"status"`
	PayerVPA         string `json:"payer_vpa,omitempty"`
	RRN              string `json:"rrn,omitempty"`
	TransactionID    string `json:"transaction_id,omitempty"`
	BankName         string `json:"bank_name,omitempty"`
	ErrorCode        string `json:"error_code,omitempty"`
	ErrorDescription string `json:"error_description,omitempty"`
	CreatedAt        int64  `json:"created_at"`
	CapturedAt       int64  `json:"captured_at,omitempty"`
}

// ListResponse represents a list response
type ListResponse struct {
	Entity string      `json:"entity"`
	Count  int         `json:"count"`
	Data   interface{} `json:"data"`
}

// ErrorResponse represents an error from the API
type ErrorResponse struct {
	Code        string                 `json:"code"`
	Description string                 `json:"description"`
	Source      string                 `json:"source"`
	Step        string                 `json:"step,omitempty"`
	Reason      string                 `json:"reason,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// Error implements the error interface
func (e *ErrorResponse) Error() string {
	return fmt.Sprintf("%s: %s", e.Code, e.Description)
}

// CreateOrder creates a new order
func (c *Client) CreateOrder(req OrderCreateRequest, idempotencyKey string) (*Order, error) {
	headers := make(map[string]string)
	if idempotencyKey != "" {
		headers["X-Idempotency-Key"] = idempotencyKey
	}

	var order Order
	err := c.request("POST", "/orders", req, &order, headers)
	if err != nil {
		return nil, err
	}

	return &order, nil
}

// FetchOrder fetches an order by ID
func (c *Client) FetchOrder(orderID string) (*Order, error) {
	var order Order
	err := c.request("GET", fmt.Sprintf("/orders/%s", orderID), nil, &order, nil)
	if err != nil {
		return nil, err
	}

	return &order, nil
}

// ListOrders lists orders
func (c *Client) ListOrders(skip, limit int) (*ListResponse, error) {
	path := fmt.Sprintf("/orders?skip=%d&limit=%d", skip, limit)

	var response ListResponse
	err := c.request("GET", path, nil, &response, nil)
	if err != nil {
		return nil, err
	}

	return &response, nil
}

// FetchPayment fetches a payment by ID
func (c *Client) FetchPayment(paymentID string) (*Payment, error) {
	var payment Payment
	err := c.request("GET", fmt.Sprintf("/payments/%s", paymentID), nil, &payment, nil)
	if err != nil {
		return nil, err
	}

	return &payment, nil
}

// ListPayments lists payments
func (c *Client) ListPayments(skip, limit int) (*ListResponse, error) {
	path := fmt.Sprintf("/payments?skip=%d&limit=%d", skip, limit)

	var response ListResponse
	err := c.request("GET", path, nil, &response, nil)
	if err != nil {
		return nil, err
	}

	return &response, nil
}

// VerifyWebhookSignature verifies webhook signature
func VerifyWebhookSignature(payload, signature string, timestamp int64, secret string, tolerance int64) bool {
	// Check timestamp tolerance
	currentTime := time.Now().Unix()
	if abs(currentTime-timestamp) > tolerance {
		return false
	}

	// Create expected signature
	signedPayload := fmt.Sprintf("%d.%s", timestamp, payload)
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(signedPayload))
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	// Compare signatures
	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

func (c *Client) request(method, path string, body interface{}, result interface{}, headers map[string]string) error {
	url := c.baseURL + path

	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return err
	}

	// Set basic auth
	req.SetBasicAuth(c.keyID, c.keySecret)

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "ZivonPay-Go/1.0.0")

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode >= 400 {
		var errorResp struct {
			Error ErrorResponse `json:"error"`
		}
		if err := json.Unmarshal(respBody, &errorResp); err != nil {
			return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
		}
		return &errorResp.Error
	}

	if result != nil {
		if err := json.Unmarshal(respBody, result); err != nil {
			return err
		}
	}

	return nil
}

func abs(n int64) int64 {
	if n < 0 {
		return -n
	}
	return n
}
