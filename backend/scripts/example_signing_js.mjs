/**
 * ZivonPay — Client-Side Request Signing Example (JavaScript / Node.js)
 *
 * When your merchant account has `enforce_request_signing` enabled,
 * every API request must include:
 *   x-timestamp: Unix epoch in seconds
 *   x-signature: HMAC-SHA256(signing_secret, canonical_string)
 *
 * Canonical string:
 *   METHOD\nPATH\nSHA256(body)\nTIMESTAMP
 */

// ── For Node.js (use built-in crypto) ──
const crypto = require("crypto");

// ── Your credentials ──
const KEY_ID = "zp_test_yourKeyId";
const KEY_SECRET = "zp_test_yourKeySecret";
const SIGNING_SECRET = "your_signing_secret_from_dashboard";
const BASE_URL = "https://api.zivonpay.com";

/**
 * Compute HMAC-SHA256 signature for a request.
 * @param {string} method   - HTTP method (GET, POST, etc.)
 * @param {string} path     - Request path (e.g., /v1/orders)
 * @param {string} body     - Raw JSON body string ("" for GET)
 * @param {string} timestamp - Unix epoch string
 * @returns {string} Hex-encoded HMAC signature
 */
function signRequest(method, path, body, timestamp) {
  const bodyHash = crypto.createHash("sha256").update(body).digest("hex");
  const canonical = `${method.toUpperCase()}\n${path}\n${bodyHash}\n${timestamp}`;

  return crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(canonical)
    .digest("hex");
}

// ─── Example: Create Order (POST) ───

async function createOrder() {
  const path = "/v1/orders";
  const payload = JSON.stringify({
    amount: 50000,
    currency: "INR",
    receipt: "order_001",
    customer: {
      name: "Rahul Sharma",
      mobile: "9876543210",
      email: "rahul@example.com",
    },
  });

  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signRequest("POST", path, payload, timestamp);
  const credentials = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      "x-timestamp": timestamp,
      "x-signature": signature,
    },
    body: payload,
  });

  const data = await res.json();
  console.log("Create Order:", res.status, data);
  return data;
}

// ─── Example: List Orders (GET) ───

async function listOrders() {
  const path = "/v1/orders";
  const body = ""; // GET = empty body
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signRequest("GET", path, body, timestamp);
  const credentials = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");

  const res = await fetch(`${BASE_URL}${path}?skip=0&limit=20`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
      "x-timestamp": timestamp,
      "x-signature": signature,
    },
  });

  const data = await res.json();
  console.log("List Orders:", res.status, data);
  return data;
}

// ─── Browser-compatible signing (Web Crypto API) ───

/**
 * Browser version using SubtleCrypto.
 * Use this in frontend applications.
 */
async function signRequestBrowser(method, path, body, timestamp) {
  const encoder = new TextEncoder();

  // SHA-256 the body
  const bodyBuf = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(body)
  );
  const bodyHash = Array.from(new Uint8Array(bodyBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const canonical = `${method.toUpperCase()}\n${path}\n${bodyHash}\n${timestamp}`;

  // Import signing secret as HMAC key
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SIGNING_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(canonical));
  return Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Run ───
(async () => {
  console.log("=== Create Order (with HMAC signing) ===");
  await createOrder();

  console.log("\n=== List Orders (with HMAC signing) ===");
  await listOrders();
})();
