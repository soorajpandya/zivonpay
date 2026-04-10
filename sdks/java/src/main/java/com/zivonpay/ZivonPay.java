package com.zivonpay;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import okhttp3.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * ZivonPay Java SDK
 * Official SDK for ZivonPay Payment Aggregator
 */
public class ZivonPay {
    private final String keyId;
    private final String keySecret;
    private final String baseUrl;
    private final OkHttpClient client;
    private final Gson gson;

    public ZivonPay(String keyId, String keySecret, String environment) {
        this.keyId = keyId;
        this.keySecret = keySecret;

        // Determine base URL
        if ("production".equals(environment)) {
            this.baseUrl = "https://api.zivonpay.com/v1";
        } else {
            this.baseUrl = "https://sandbox.api.zivonpay.com/v1";
        }

        // Configure HTTP client
        String credentials = keyId + ":" + keySecret;
        String basicAuth = "Basic " + Base64.getEncoder().encodeToString(
                credentials.getBytes(StandardCharsets.UTF_8)
        );

        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .addInterceptor(chain -> {
                    Request original = chain.request();
                    Request request = original.newBuilder()
                            .header("Authorization", basicAuth)
                            .header("Content-Type", "application/json")
                            .header("User-Agent", "ZivonPay-Java/1.0.0")
                            .method(original.method(), original.body())
                            .build();
                    return chain.proceed(request);
                })
                .build();

        this.gson = new GsonBuilder().create();
    }

    // Orders API
    public Map<String, Object> createOrder(Map<String, Object> orderData, String idempotencyKey) 
            throws IOException, ZivonPayException {
        String endpoint = "/orders";
        
        Request.Builder requestBuilder = new Request.Builder()
                .url(baseUrl + endpoint)
                .post(RequestBody.create(
                        gson.toJson(orderData),
                        MediaType.parse("application/json")
                ));

        if (idempotencyKey != null) {
            requestBuilder.header("X-Idempotency-Key", idempotencyKey);
        }

        return executeRequest(requestBuilder.build());
    }

    public Map<String, Object> fetchOrder(String orderId) throws IOException, ZivonPayException {
        String endpoint = "/orders/" + orderId;
        Request request = new Request.Builder()
                .url(baseUrl + endpoint)
                .get()
                .build();

        return executeRequest(request);
    }

    public Map<String, Object> listOrders(int skip, int limit) throws IOException, ZivonPayException {
        String endpoint = String.format("/orders?skip=%d&limit=%d", skip, limit);
        Request request = new Request.Builder()
                .url(baseUrl + endpoint)
                .get()
                .build();

        return executeRequest(request);
    }

    // Payments API
    public Map<String, Object> fetchPayment(String paymentId) throws IOException, ZivonPayException {
        String endpoint = "/payments/" + paymentId;
        Request request = new Request.Builder()
                .url(baseUrl + endpoint)
                .get()
                .build();

        return executeRequest(request);
    }

    public Map<String, Object> listPayments(int skip, int limit) throws IOException, ZivonPayException {
        String endpoint = String.format("/payments?skip=%d&limit=%d", skip, limit);
        Request request = new Request.Builder()
                .url(baseUrl + endpoint)
                .get()
                .build();

        return executeRequest(request);
    }

    // Webhook verification
    public static boolean verifyWebhookSignature(
            String payload,
            String signature,
            long timestamp,
            String secret,
            int tolerance
    ) {
        try {
            // Check timestamp tolerance
            long currentTime = System.currentTimeMillis() / 1000;
            if (Math.abs(currentTime - timestamp) > tolerance) {
                return false;
            }

            // Create expected signature
            String signedPayload = timestamp + "." + payload;
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(signedPayload.getBytes(StandardCharsets.UTF_8));

            // Convert to hex string
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            String expectedSignature = hexString.toString();

            // Compare signatures
            return MessageDigest.isEqual(
                    signature.getBytes(StandardCharsets.UTF_8),
                    expectedSignature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            return false;
        }
    }

    // Execute HTTP request
    private Map<String, Object> executeRequest(Request request) throws IOException, ZivonPayException {
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "{}";

            if (!response.isSuccessful()) {
                Map<String, Object> errorData = gson.fromJson(responseBody, Map.class);
                throw new ZivonPayException(errorData);
            }

            return gson.fromJson(responseBody, Map.class);
        }
    }

    // Custom exception
    public static class ZivonPayException extends Exception {
        private final String code;
        private final String description;
        private final Map<String, Object> details;

        public ZivonPayException(Map<String, Object> errorData) {
            super((String) ((Map) errorData.get("error")).get("description"));
            Map<String, Object> error = (Map<String, Object>) errorData.get("error");
            this.code = (String) error.get("code");
            this.description = (String) error.get("description");
            this.details = error;
        }

        public String getCode() {
            return code;
        }

        public String getDescription() {
            return description;
        }

        public Map<String, Object> getDetails() {
            return details;
        }
    }
}
