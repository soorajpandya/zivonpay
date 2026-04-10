<?php

namespace ZivonPay;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Exception\RequestException;

/**
 * ZivonPay PHP SDK
 * Official SDK for ZivonPay Payment Aggregator
 */
class ZivonPay
{
    private string $keyId;
    private string $keySecret;
    private string $baseUrl;
    private GuzzleClient $client;

    /**
     * Create a new ZivonPay client
     *
     * @param string $keyId API key ID
     * @param string $keySecret API secret key
     * @param string $environment 'sandbox' or 'production'
     * @param int $timeout Request timeout in seconds
     */
    public function __construct(
        string $keyId,
        string $keySecret,
        string $environment = 'sandbox',
        int $timeout = 30
    ) {
        $this->keyId = $keyId;
        $this->keySecret = $keySecret;

        // Determine base URL
        $this->baseUrl = $environment === 'production'
            ? 'https://api.zivonpay.com/v1'
            : 'https://sandbox.api.zivonpay.com/v1';

        // Configure HTTP client
        $this->client = new GuzzleClient([
            'base_uri' => $this->baseUrl,
            'timeout' => $timeout,
            'auth' => [$keyId, $keySecret],
            'headers' => [
                'Content-Type' => 'application/json',
                'User-Agent' => 'ZivonPay-PHP/1.0.0',
            ],
        ]);
    }

    /**
     * Create a new order
     *
     * @param array $data Order data
     * @param string|null $idempotencyKey Optional idempotency key
     * @return array Order data
     * @throws ZivonPayException
     */
    public function createOrder(array $data, ?string $idempotencyKey = null): array
    {
        $headers = [];
        if ($idempotencyKey !== null) {
            $headers['X-Idempotency-Key'] = $idempotencyKey;
        }

        return $this->request('POST', '/orders', $data, $headers);
    }

    /**
     * Fetch order by ID
     *
     * @param string $orderId Order UUID
     * @return array Order data
     * @throws ZivonPayException
     */
    public function fetchOrder(string $orderId): array
    {
        return $this->request('GET', "/orders/{$orderId}");
    }

    /**
     * List orders
     *
     * @param int $skip Number of records to skip
     * @param int $limit Number of records to return
     * @return array List response
     * @throws ZivonPayException
     */
    public function listOrders(int $skip = 0, int $limit = 10): array
    {
        return $this->request('GET', '/orders', null, [], [
            'skip' => $skip,
            'limit' => $limit,
        ]);
    }

    /**
     * Fetch payment by ID
     *
     * @param string $paymentId Payment UUID
     * @return array Payment data
     * @throws ZivonPayException
     */
    public function fetchPayment(string $paymentId): array
    {
        return $this->request('GET', "/payments/{$paymentId}");
    }

    /**
     * List payments
     *
     * @param int $skip Number of records to skip
     * @param int $limit Number of records to return
     * @return array List response
     * @throws ZivonPayException
     */
    public function listPayments(int $skip = 0, int $limit = 10): array
    {
        return $this->request('GET', '/payments', null, [], [
            'skip' => $skip,
            'limit' => $limit,
        ]);
    }

    /**
     * Verify webhook signature
     *
     * @param string $payload Raw request body
     * @param string $signature Signature from header
     * @param int $timestamp Timestamp from header
     * @param string $secret Webhook secret
     * @param int $tolerance Time tolerance in seconds
     * @return bool True if valid
     */
    public static function verifyWebhookSignature(
        string $payload,
        string $signature,
        int $timestamp,
        string $secret,
        int $tolerance = 300
    ): bool {
        // Check timestamp tolerance
        $currentTime = time();
        if (abs($currentTime - $timestamp) > $tolerance) {
            return false;
        }

        // Create expected signature
        $signedPayload = "{$timestamp}.{$payload}";
        $expectedSignature = hash_hmac('sha256', $signedPayload, $secret);

        // Compare signatures
        return hash_equals($signature, $expectedSignature);
    }

    /**
     * Make HTTP request
     *
     * @param string $method HTTP method
     * @param string $path API path
     * @param array|null $data Request body
     * @param array $headers Additional headers
     * @param array $params Query parameters
     * @return array Response data
     * @throws ZivonPayException
     */
    private function request(
        string $method,
        string $path,
        ?array $data = null,
        array $headers = [],
        array $params = []
    ): array {
        try {
            $options = ['headers' => $headers];

            if (!empty($data)) {
                $options['json'] = $data;
            }

            if (!empty($params)) {
                $options['query'] = $params;
            }

            $response = $this->client->request($method, $path, $options);
            $body = (string) $response->getBody();

            return json_decode($body, true);
        } catch (RequestException $e) {
            if ($e->hasResponse()) {
                $response = $e->getResponse();
                $body = (string) $response->getBody();
                $errorData = json_decode($body, true);

                if (isset($errorData['error'])) {
                    throw new ZivonPayException($errorData['error']);
                }
            }

            throw new ZivonPayException([
                'code' => 'REQUEST_ERROR',
                'description' => $e->getMessage(),
                'source' => 'sdk',
            ]);
        }
    }
}

/**
 * ZivonPay Exception
 */
class ZivonPayException extends \Exception
{
    public string $code;
    public string $description;
    public string $source;
    public ?string $step;
    public ?string $reason;
    public array $metadata;

    public function __construct(array $errorData)
    {
        $this->code = $errorData['code'] ?? 'UNKNOWN_ERROR';
        $this->description = $errorData['description'] ?? 'Unknown error';
        $this->source = $errorData['source'] ?? 'unknown';
        $this->step = $errorData['step'] ?? null;
        $this->reason = $errorData['reason'] ?? null;
        $this->metadata = $errorData['metadata'] ?? [];

        parent::__construct($this->description);
    }
}
