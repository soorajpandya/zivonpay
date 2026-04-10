"""
ZivonPay Developer Documentation — self-contained HTML docs served by FastAPI.
Inspired by Razorpay / Stripe developer portals.
"""

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, FileResponse
from pathlib import Path
import os

router = APIRouter()

# Base path for postman files (repo_root/docs/postman)
_POSTMAN_DIR = Path(__file__).resolve().parents[5] / "docs" / "postman"

# ─── colour tokens ──────────────────────────────────────────────────────────
_BG       = "#0a0e1a"
_SIDEBAR  = "#0f1424"
_CARD     = "#141929"
_BORDER   = "#1e2640"
_TEXT     = "#e2e8f0"
_MUTED    = "#8892b0"
_ACCENT   = "#6c63ff"
_ACCENT2  = "#00d4aa"
_GREEN    = "#10b981"
_RED      = "#ef4444"
_ORANGE   = "#f59e0b"
_BLUE     = "#3b82f6"
_CODE_BG  = "#0d1117"


def _docs_page() -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ZivonPay — Developer Documentation</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
html{{scroll-behavior:smooth}}
body{{font-family:'Inter',system-ui,sans-serif;background:{_BG};color:{_TEXT};line-height:1.65;overflow-x:hidden}}

/* ── scrollbar ── */
::-webkit-scrollbar{{width:6px}}
::-webkit-scrollbar-track{{background:{_BG}}}
::-webkit-scrollbar-thumb{{background:{_BORDER};border-radius:3px}}

/* ── layout ── */
.layout{{display:flex;min-height:100vh}}
.sidebar{{position:fixed;top:0;left:0;width:280px;height:100vh;background:{_SIDEBAR};border-right:1px solid {_BORDER};overflow-y:auto;z-index:100;padding:24px 0}}
.main{{margin-left:280px;flex:1;padding:48px 56px 80px;max-width:960px}}

/* ── sidebar ── */
.logo{{padding:0 24px 28px;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.3px}}
.logo span{{color:{_ACCENT}}}
.nav-group{{margin-bottom:8px}}
.nav-label{{padding:8px 24px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.2px;color:{_MUTED}}}
.nav-link{{display:block;padding:7px 24px 7px 32px;font-size:13.5px;color:{_MUTED};text-decoration:none;transition:all .15s;border-left:3px solid transparent}}
.nav-link:hover,.nav-link.active{{color:#fff;background:rgba(108,99,255,.08);border-left-color:{_ACCENT}}}

/* ── headings ── */
h1{{font-size:32px;font-weight:700;letter-spacing:-0.5px;margin-bottom:8px}}
h2{{font-size:22px;font-weight:600;margin:48px 0 16px;padding-top:24px;border-top:1px solid {_BORDER};letter-spacing:-0.3px}}
h3{{font-size:17px;font-weight:600;margin:28px 0 10px;color:{_ACCENT2}}}
p{{margin-bottom:14px;color:{_MUTED};font-size:15px}}
.subtitle{{color:{_MUTED};font-size:16px;margin-bottom:36px}}

/* ── badge ── */
.method{{display:inline-block;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700;font-family:'JetBrains Mono',monospace;margin-right:8px;vertical-align:middle}}
.method-get{{background:rgba(16,185,129,.15);color:{_GREEN}}}
.method-post{{background:rgba(59,130,246,.15);color:{_BLUE}}}
.method-put{{background:rgba(245,158,11,.15);color:{_ORANGE}}}
.method-del{{background:rgba(239,68,68,.15);color:{_RED}}}
.status{{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-family:'JetBrains Mono',monospace}}
.s2{{background:rgba(16,185,129,.12);color:{_GREEN}}}
.s4{{background:rgba(239,68,68,.12);color:{_RED}}}

/* ── endpoint card ── */
.endpoint{{background:{_CARD};border:1px solid {_BORDER};border-radius:10px;padding:24px 28px;margin:18px 0}}
.ep-url{{font-family:'JetBrains Mono',monospace;font-size:14px;color:#fff;background:{_CODE_BG};padding:8px 14px;border-radius:6px;display:inline-block;margin:8px 0 10px;word-break:break-all}}
.ep-desc{{color:{_MUTED};font-size:14px;margin-bottom:14px}}

/* ── table ── */
.param-table{{width:100%;border-collapse:collapse;margin:12px 0 8px;font-size:13.5px}}
.param-table th{{text-align:left;padding:8px 12px;background:{_CODE_BG};color:{_MUTED};font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.8px}}
.param-table td{{padding:8px 12px;border-top:1px solid {_BORDER}}}
.param-table .req{{color:{_RED};font-weight:600;font-size:11px}}
.param-table .opt{{color:{_MUTED};font-size:11px}}
.type{{color:{_ACCENT};font-family:'JetBrains Mono',monospace;font-size:12px}}

/* ── code block ── */
.code-tabs{{display:flex;gap:0;margin:14px 0 0;border-bottom:1px solid {_BORDER}}}
.code-tab{{padding:7px 16px;font-size:12px;font-weight:600;color:{_MUTED};cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;background:transparent;border:none;font-family:'Inter',sans-serif}}
.code-tab.active{{color:{_ACCENT};border-bottom-color:{_ACCENT}}}
.code-block{{position:relative;background:{_CODE_BG};border:1px solid {_BORDER};border-radius:0 0 8px 8px;overflow:hidden}}
.code-block pre{{padding:16px 20px;overflow-x:auto;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.6;color:{_TEXT};margin:0}}
.copy-btn{{position:absolute;top:8px;right:8px;background:rgba(108,99,255,.2);color:{_ACCENT};border:none;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:'Inter',sans-serif;transition:background .15s}}
.copy-btn:hover{{background:rgba(108,99,255,.4)}}

/* ── info boxes ── */
.info-box{{padding:14px 18px;border-radius:8px;font-size:14px;margin:16px 0}}
.info-box.tip{{background:rgba(16,185,129,.08);border-left:3px solid {_GREEN};color:{_GREEN}}}
.info-box.warn{{background:rgba(245,158,11,.08);border-left:3px solid {_ORANGE};color:{_ORANGE}}}
.info-box.danger{{background:rgba(239,68,68,.08);border-left:3px solid {_RED};color:{_RED}}}

/* ── env switcher ── */
.env-switch{{display:flex;gap:0;background:{_CARD};border:1px solid {_BORDER};border-radius:8px;overflow:hidden;margin:16px 0;width:fit-content}}
.env-btn{{padding:8px 20px;font-size:13px;font-weight:600;cursor:pointer;background:transparent;border:none;color:{_MUTED};transition:all .15s;font-family:'Inter',sans-serif}}
.env-btn.active{{background:{_ACCENT};color:#fff}}

/* ── responsive ── */
@media(max-width:900px){{
  .sidebar{{display:none}}
  .main{{margin-left:0;padding:24px 20px}}
}}
</style>
</head>
<body>
<div class="layout">

<!-- ═══════════ Sidebar ═══════════ -->
<nav class="sidebar">
  <div class="logo">Zivon<span>Pay</span></div>

  <div class="nav-group">
    <div class="nav-label">Getting Started</div>
    <a class="nav-link active" href="#introduction">Introduction</a>
    <a class="nav-link" href="#environments">Environments</a>
    <a class="nav-link" href="#authentication">Authentication</a>
    <a class="nav-link" href="#errors">Error Handling</a>
    <a class="nav-link" href="#rate-limits">Rate Limits</a>
    <a class="nav-link" href="#pagination">Pagination</a>
    <a class="nav-link" href="#idempotency">Idempotency</a>
  </div>

  <div class="nav-group">
    <div class="nav-label">Auth API</div>
    <a class="nav-link" href="#signup">Signup</a>
    <a class="nav-link" href="#login">Login</a>
  </div>

  <div class="nav-group">
    <div class="nav-label">Orders API</div>
    <a class="nav-link" href="#create-order">Create Order</a>
    <a class="nav-link" href="#get-order">Get Order</a>
    <a class="nav-link" href="#list-orders">List Orders</a>
  </div>

  <div class="nav-group">
    <div class="nav-label">Payments API</div>
    <a class="nav-link" href="#get-payment">Get Payment</a>
    <a class="nav-link" href="#list-payments">List Payments</a>
  </div>

  <div class="nav-group">
    <div class="nav-label">Payment Links</div>
    <a class="nav-link" href="#create-intent">Create Payment Link</a>
    <a class="nav-link" href="#get-intent">Get Payment Link</a>
    <a class="nav-link" href="#list-intents">List Payment Links</a>
  </div>

  <div class="nav-group">
    <div class="nav-label">Webhooks</div>
    <a class="nav-link" href="#webhooks">Webhook Events</a>
    <a class="nav-link" href="#webhook-verification">Webhook Verification</a>
  </div>

  <div class="nav-group">
    <div class="nav-label">Tools</div>
    <a class="nav-link" href="#postman">Postman Collection</a>
    <a class="nav-link" href="#sdks">SDKs</a>
  </div>
</nav>

<!-- ═══════════ Main content ═══════════ -->
<main class="main">

<!-- ── Introduction ── -->
<section id="introduction">
<h1>ZivonPay API Reference</h1>
<p class="subtitle">Production-grade UPI payment aggregator. Accept payments via QR codes, UPI intent links, and hosted payment pages.</p>

<div class="info-box tip">
  <strong>Base URLs</strong> — Use sandbox keys for testing. No real money is charged in sandbox mode.
</div>

<div class="env-switch" id="envSwitcher">
  <button class="env-btn active" onclick="setEnv('sandbox')">Sandbox</button>
  <button class="env-btn" onclick="setEnv('production')">Production</button>
</div>

<div class="endpoint">
  <table class="param-table">
    <tr><td style="font-weight:600;width:120px">Sandbox</td><td><code>https://api.zivonpay.com</code>&nbsp; (ENVIRONMENT=sandbox)</td></tr>
    <tr><td style="font-weight:600">Production</td><td><code>https://api.zivonpay.com</code>&nbsp; (ENVIRONMENT=production)</td></tr>
    <tr><td style="font-weight:600">API Version</td><td><code>/v1</code></td></tr>
    <tr><td style="font-weight:600">Content-Type</td><td><code>application/json</code></td></tr>
  </table>
</div>
</section>

<!-- ── Environments ── -->
<section id="environments">
<h2>Environments</h2>
<p>Each merchant receives <strong>two sets of API keys</strong> on signup — one for testing, one for production.</p>

<div class="endpoint">
  <table class="param-table">
    <tr><th>Environment</th><th>Key Prefix</th><th>Secret Prefix</th><th>Real Payments?</th></tr>
    <tr><td>Sandbox</td><td><code>zp_test_*</code></td><td><code>zp_test_*</code></td><td>No — mock UPI</td></tr>
    <tr><td>Production</td><td><code>zp_live_*</code></td><td><code>zp_live_*</code></td><td>Yes — real money</td></tr>
  </table>
</div>

<div class="info-box warn">
  <strong>Important:</strong> The API secret is shown <strong>only once</strong> at signup. Store it securely.
</div>
</section>

<!-- ── Authentication ── -->
<section id="authentication">
<h2>Authentication</h2>
<p>All API requests are authenticated using <strong>HTTP Basic Auth</strong> with your API key ID and secret. The key prefix determines the environment (sandbox vs production).</p>

<h3>HTTP Basic Auth (key_id : key_secret)</h3>
<p>Pass your <code>key_id</code> as the username and <code>key_secret</code> as the password via HTTP Basic authentication.</p>

<div class="info-box tip">
  <strong>Sandbox keys</strong> (<code>zp_test_*</code>) &rarr; mock UPI, no real money charged<br>
  <strong>Live keys</strong> (<code>zp_live_*</code>) &rarr; real transactions on production
</div>

<div class="code-tabs">
  <button class="code-tab active" onclick="switchTab(this,'auth-curl')">cURL</button>
  <button class="code-tab" onclick="switchTab(this,'auth-js')">JavaScript</button>
  <button class="code-tab" onclick="switchTab(this,'auth-py')">Python</button>
</div>
<div class="code-block">
<button class="copy-btn" onclick="copyCode(this)">Copy</button>
<pre id="auth-curl"># cURL uses the -u flag for Basic auth
curl https://api.zivonpay.com/v1/orders \\
  -u "zp_test_yourKeyId:zp_test_yourKeySecret"</pre>
<pre id="auth-js" style="display:none">// JavaScript — encode key_id:key_secret as Base64
const credentials = btoa("zp_test_yourKeyId:zp_test_yourKeySecret");
fetch("https://api.zivonpay.com/v1/orders", {{
  headers: {{ "Authorization": `Basic ${{credentials}}` }}
}});</pre>
<pre id="auth-py" style="display:none"># Python requests supports auth= tuple natively
import requests

resp = requests.get(
    "https://api.zivonpay.com/v1/orders",
    auth=("zp_test_yourKeyId", "zp_test_yourKeySecret")
)</pre>
</div>

<div class="info-box warn">
  <strong>Keep your key_secret safe.</strong> It is shown only once at signup. Never expose it in client-side code or version control.
</div>
</section>

<!-- ── Error Handling ── -->
<section id="errors">
<h2>Error Handling</h2>
<p>All errors follow a standard format:</p>
<div class="code-block">
<button class="copy-btn" onclick="copyCode(this)">Copy</button>
<pre>{{
  "error": {{
    "code": "BAD_REQUEST_ERROR",
    "description": "Amount must be at least 100 paise",
    "source": "business",
    "step": "order_creation",
    "reason": "validation_failed",
    "metadata": {{}}
  }}
}}</pre>
</div>

<div class="endpoint">
<table class="param-table">
  <tr><th>HTTP Code</th><th>Error Code</th><th>Description</th></tr>
  <tr><td><span class="status s4">400</span></td><td><code>BAD_REQUEST_ERROR</code></td><td>Invalid request parameters</td></tr>
  <tr><td><span class="status s4">401</span></td><td><code>AUTHENTICATION_ERROR</code></td><td>Invalid or missing credentials</td></tr>
  <tr><td><span class="status s4">403</span></td><td><code>FORBIDDEN</code></td><td>Insufficient permissions / IP blocked</td></tr>
  <tr><td><span class="status s4">404</span></td><td><code>NOT_FOUND</code></td><td>Resource does not exist</td></tr>
  <tr><td><span class="status s4">409</span></td><td><code>CONFLICT</code></td><td>Duplicate idempotency key</td></tr>
  <tr><td><span class="status s4">429</span></td><td><code>RATE_LIMIT_ERROR</code></td><td>Too many requests</td></tr>
  <tr><td><span class="status s4">500</span></td><td><code>INTERNAL_ERROR</code></td><td>Server error — contact support</td></tr>
</table>
</div>
</section>

<!-- ── Rate Limits ── -->
<section id="rate-limits">
<h2>Rate Limits</h2>
<div class="endpoint">
<table class="param-table">
  <tr><th>Endpoint</th><th>Limit</th><th>Window</th></tr>
  <tr><td><code>POST /v1/orders</code></td><td>1,000 requests</td><td>per minute</td></tr>
  <tr><td><code>GET /v1/orders/*</code></td><td>5,000 requests</td><td>per minute</td></tr>
  <tr><td>All other endpoints</td><td>1,000 requests</td><td>per minute</td></tr>
</table>
</div>
<p>Rate-limited responses return <code>429 Too Many Requests</code> with a <code>Retry-After</code> header.</p>
</section>

<!-- ── Pagination ── -->
<section id="pagination">
<h2>Pagination</h2>
<p>List endpoints support cursor-based pagination:</p>
<div class="endpoint">
<table class="param-table">
  <tr><th>Parameter</th><th>Type</th><th>Default</th><th>Description</th></tr>
  <tr><td><code>skip</code></td><td class="type">int</td><td>0</td><td>Number of records to skip</td></tr>
  <tr><td><code>limit</code></td><td class="type">int</td><td>10</td><td>Number of records to return (max 100)</td></tr>
</table>
</div>
<div class="code-block">
<button class="copy-btn" onclick="copyCode(this)">Copy</button>
<pre>GET /v1/orders?skip=0&limit=20

// Response
{{
  "entity": "list",
  "count": 20,
  "data": [ ... ]
}}</pre>
</div>
</section>

<!-- ── Idempotency ── -->
<section id="idempotency">
<h2>Idempotency</h2>
<p>Pass an <code>X-Idempotency-Key</code> header on <code>POST</code> requests to safely retry without duplicates. Keys expire after 24 hours.</p>
<div class="code-block">
<button class="copy-btn" onclick="copyCode(this)">Copy</button>
<pre>X-Idempotency-Key: unique-request-id-12345</pre>
</div>
</section>

<!-- ═══════════ AUTH API ═══════════ -->

<section id="signup">
<h2>Signup</h2>
<div class="endpoint">
  <span class="method method-post">POST</span>
  <span class="ep-url">/v1/auth/signup</span>
  <p class="ep-desc">Register a new merchant account. Returns sandbox and live API credentials, JWT token, and optional webhook secret.</p>

  <h3>Request Body</h3>
  <table class="param-table">
    <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
    <tr><td><code>business_name</code></td><td class="type">string</td><td class="req">Yes</td><td>Business name (2-255 chars)</td></tr>
    <tr><td><code>email</code></td><td class="type">string</td><td class="req">Yes</td><td>Business email</td></tr>
    <tr><td><code>password</code></td><td class="type">string</td><td class="req">Yes</td><td>Account password (min 8 chars)</td></tr>
    <tr><td><code>mobile</code></td><td class="type">string</td><td class="opt">No</td><td>Mobile number</td></tr>
    <tr><td><code>webhook_url</code></td><td class="type">string</td><td class="opt">No</td><td>Webhook URL for notifications</td></tr>
  </table>

  <div class="code-tabs">
    <button class="code-tab active" onclick="switchTab(this,'signup-curl')">cURL</button>
    <button class="code-tab" onclick="switchTab(this,'signup-js')">JavaScript</button>
    <button class="code-tab" onclick="switchTab(this,'signup-py')">Python</button>
  </div>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre id="signup-curl">curl -X POST https://api.zivonpay.com/v1/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{{
    "business_name": "My Business",
    "email": "merchant@example.com",
    "password": "SecurePass123!",
    "webhook_url": "https://example.com/webhook"
  }}'</pre>
    <pre id="signup-js" style="display:none">const res = await fetch("https://api.zivonpay.com/v1/auth/signup", {{
  method: "POST",
  headers: {{ "Content-Type": "application/json" }},
  body: JSON.stringify({{
    business_name: "My Business",
    email: "merchant@example.com",
    password: "SecurePass123!",
    webhook_url: "https://example.com/webhook"
  }})
}});
const data = await res.json();</pre>
    <pre id="signup-py" style="display:none">import requests

resp = requests.post("https://api.zivonpay.com/v1/auth/signup", json={{
    "business_name": "My Business",
    "email": "merchant@example.com",
    "password": "SecurePass123!",
    "webhook_url": "https://example.com/webhook"
}})
data = resp.json()</pre>
  </div>

  <h3>Response <span class="status s2">201</span></h3>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre>{{
  "merchant": {{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "business_name": "My Business",
    "email": "merchant@example.com",
    "api_key_id": "zp_test_abc123def456",
    "live_api_key_id": "zp_live_xyz789ghi012",
    "environment": "sandbox",
    "is_active": true,
    "is_verified": false
  }},
  "sandbox_credentials": {{
    "key_id": "zp_test_abc123def456",
    "key_secret": "zp_test_secretKeepThisSecure123"
  }},
  "live_credentials": {{
    "key_id": "zp_live_xyz789ghi012",
    "key_secret": "zp_live_secretKeepThisSecure456"
  }},
  "webhook_secret": "whsec_sandbox_abc123keepthissecret",
  "auth": {{
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 3600
  }}
}}</pre>
  </div>
</div>
</section>

<section id="login">
<h2>Login</h2>
<div class="endpoint">
  <span class="method method-post">POST</span>
  <span class="ep-url">/v1/auth/login</span>
  <p class="ep-desc">Authenticate and receive a JWT access token.</p>

  <h3>Request Body</h3>
  <table class="param-table">
    <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
    <tr><td><code>email</code></td><td class="type">string</td><td class="req">Yes</td><td>Registered email</td></tr>
    <tr><td><code>password</code></td><td class="type">string</td><td class="req">Yes</td><td>Account password</td></tr>
  </table>

  <div class="code-tabs">
    <button class="code-tab active" onclick="switchTab(this,'login-curl')">cURL</button>
    <button class="code-tab" onclick="switchTab(this,'login-js')">JavaScript</button>
    <button class="code-tab" onclick="switchTab(this,'login-py')">Python</button>
  </div>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre id="login-curl">curl -X POST https://api.zivonpay.com/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{{
    "email": "merchant@example.com",
    "password": "SecurePass123!"
  }}'</pre>
    <pre id="login-js" style="display:none">const res = await fetch("https://api.zivonpay.com/v1/auth/login", {{
  method: "POST",
  headers: {{ "Content-Type": "application/json" }},
  body: JSON.stringify({{
    email: "merchant@example.com",
    password: "SecurePass123!"
  }})
}});
const {{ access_token }} = await res.json();</pre>
    <pre id="login-py" style="display:none">import requests

resp = requests.post("https://api.zivonpay.com/v1/auth/login", json={{
    "email": "merchant@example.com",
    "password": "SecurePass123!"
}})
token = resp.json()["access_token"]</pre>
  </div>

  <h3>Response <span class="status s2">200</span></h3>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre>{{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}}</pre>
  </div>
</div>
</section>

<!-- ═══════════ ORDERS API ═══════════ -->

<section id="create-order">
<h2>Create Order</h2>
<div class="endpoint">
  <span class="method method-post">POST</span>
  <span class="ep-url">/v1/orders</span>
  <p class="ep-desc">Create a UPI payment order. Returns a QR code URL and UPI intent link. Amount is in <strong>paise</strong> (100 = ₹1).</p>

  <h3>Headers</h3>
  <table class="param-table">
    <tr><th>Header</th><th>Required</th><th>Description</th></tr>
    <tr><td><code>Authorization</code></td><td class="req">Yes</td><td><code>Basic base64(key_id:key_secret)</code></td></tr>
    <tr><td><code>X-Idempotency-Key</code></td><td class="opt">No</td><td>Unique key to prevent duplicate orders</td></tr>
  </table>

  <h3>Request Body</h3>
  <table class="param-table">
    <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
    <tr><td><code>amount</code></td><td class="type">integer</td><td class="req">Yes</td><td>Amount in paise (min 100, max 10000000)</td></tr>
    <tr><td><code>currency</code></td><td class="type">string</td><td class="opt">No</td><td>Currency code (default: <code>INR</code>)</td></tr>
    <tr><td><code>receipt</code></td><td class="type">string</td><td class="req">Yes</td><td>Your order reference ID</td></tr>
    <tr><td><code>customer.name</code></td><td class="type">string</td><td class="req">Yes</td><td>Customer name (2-255 chars)</td></tr>
    <tr><td><code>customer.mobile</code></td><td class="type">string</td><td class="req">Yes</td><td>10-digit Indian mobile number</td></tr>
    <tr><td><code>customer.email</code></td><td class="type">string</td><td class="opt">No</td><td>Customer email</td></tr>
    <tr><td><code>notes</code></td><td class="type">object</td><td class="opt">No</td><td>Key-value metadata</td></tr>
  </table>

  <div class="code-tabs">
    <button class="code-tab active" onclick="switchTab(this,'create-order-curl')">cURL</button>
    <button class="code-tab" onclick="switchTab(this,'create-order-js')">JavaScript</button>
    <button class="code-tab" onclick="switchTab(this,'create-order-py')">Python</button>
  </div>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre id="create-order-curl">curl -X POST https://api.zivonpay.com/v1/orders \\
  -u "zp_test_yourKeyId:zp_test_yourKeySecret" \\
  -H "Content-Type: application/json" \\
  -H "X-Idempotency-Key: order_123_v1" \\
  -d '{{
    "amount": 50000,
    "currency": "INR",
    "receipt": "order_123",
    "customer": {{
      "name": "Rahul Sharma",
      "mobile": "8877664543",
      "email": "rahul@example.com"
    }},
    "notes": {{
      "plan": "Premium Monthly"
    }}
  }}'</pre>
    <pre id="create-order-js" style="display:none">const keyId = "zp_test_yourKeyId";
const keySecret = "zp_test_yourKeySecret";
const credentials = btoa(`${{keyId}}:${{keySecret}}`);

const res = await fetch("https://api.zivonpay.com/v1/orders", {{
  method: "POST",
  headers: {{
    "Authorization": `Basic ${{credentials}}`,
    "Content-Type": "application/json",
    "X-Idempotency-Key": "order_123_v1"
  }},
  body: JSON.stringify({{
    amount: 50000,
    currency: "INR",
    receipt: "order_123",
    customer: {{
      name: "Rahul Sharma",
      mobile: "8877664543"
    }}
  }})
}});
const order = await res.json();</pre>
    <pre id="create-order-py" style="display:none">import requests

resp = requests.post(
    "https://api.zivonpay.com/v1/orders",
    auth=("zp_test_yourKeyId", "zp_test_yourKeySecret"),
    headers={{"X-Idempotency-Key": "order_123_v1"}},
    json={{
        "amount": 50000,
        "currency": "INR",
        "receipt": "order_123",
        "customer": {{
            "name": "Rahul Sharma",
            "mobile": "8877664543"
        }}
    }}
)
order = resp.json()</pre>
  </div>

  <h3>Response <span class="status s2">201</span></h3>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre>{{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "entity": "order",
  "amount": 50000,
  "currency": "INR",
  "status": "qr_generated",
  "receipt": "order_123",
  "upi_intent_url": "upi://pay?pa=ps1.sprintnxt@fin&pn=ZivonPay&am=500.00&tr=...",
  "qr_code_url": null,
  "notes": {{ "plan": "Premium Monthly" }},
  "created_at": 1709049451,
  "expires_at": null,
  "paid_at": null
}}</pre>
  </div>
</div>
</section>

<section id="get-order">
<h2>Get Order</h2>
<div class="endpoint">
  <span class="method method-get">GET</span>
  <span class="ep-url">/v1/orders/{{order_id}}</span>
  <p class="ep-desc">Fetch a specific order by its UUID.</p>

  <div class="code-tabs">
    <button class="code-tab active" onclick="switchTab(this,'get-order-curl')">cURL</button>
    <button class="code-tab" onclick="switchTab(this,'get-order-js')">JavaScript</button>
    <button class="code-tab" onclick="switchTab(this,'get-order-py')">Python</button>
  </div>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre id="get-order-curl">curl https://api.zivonpay.com/v1/orders/550e8400-e29b-41d4-a716-446655440000 \\
  -u "zp_test_yourKeyId:zp_test_yourKeySecret"</pre>
    <pre id="get-order-js" style="display:none">const credentials = btoa("zp_test_yourKeyId:zp_test_yourKeySecret");
const res = await fetch(
  `https://api.zivonpay.com/v1/orders/${{orderId}}`,
  {{ headers: {{ "Authorization": `Basic ${{credentials}}` }} }}
);
const order = await res.json();</pre>
    <pre id="get-order-py" style="display:none">resp = requests.get(
    f"https://api.zivonpay.com/v1/orders/{{order_id}}",
    auth=("zp_test_yourKeyId", "zp_test_yourKeySecret")
)
order = resp.json()</pre>
  </div>
</div>
</section>

<section id="list-orders">
<h2>List Orders</h2>
<div class="endpoint">
  <span class="method method-get">GET</span>
  <span class="ep-url">/v1/orders?skip=0&limit=20</span>
  <p class="ep-desc">List all orders for the authenticated merchant. Supports pagination.</p>

  <div class="code-tabs">
    <button class="code-tab active" onclick="switchTab(this,'list-orders-curl')">cURL</button>
    <button class="code-tab" onclick="switchTab(this,'list-orders-py')">Python</button>
  </div>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre id="list-orders-curl">curl "https://api.zivonpay.com/v1/orders?skip=0&limit=20" \\
  -u "zp_test_yourKeyId:zp_test_yourKeySecret"</pre>
    <pre id="list-orders-py" style="display:none">resp = requests.get(
    "https://api.zivonpay.com/v1/orders",
    auth=("zp_test_yourKeyId", "zp_test_yourKeySecret"),
    params={{"skip": 0, "limit": 20}}
)
orders = resp.json()</pre>
  </div>

  <h3>Response <span class="status s2">200</span></h3>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre>{{
  "entity": "list",
  "count": 2,
  "data": [
    {{ "id": "...", "entity": "order", "amount": 50000, "status": "paid", ... }},
    {{ "id": "...", "entity": "order", "amount": 1000, "status": "created", ... }}
  ]
}}</pre>
  </div>
</div>
</section>

<!-- ═══════════ PAYMENTS API ═══════════ -->

<section id="get-payment">
<h2>Get Payment</h2>
<div class="endpoint">
  <span class="method method-get">GET</span>
  <span class="ep-url">/v1/payments/{{payment_id}}</span>
  <p class="ep-desc">Fetch details of a specific payment including UPI payer VPA, RRN, and bank name.</p>

  <div class="code-tabs">
    <button class="code-tab active" onclick="switchTab(this,'get-pay-curl')">cURL</button>
    <button class="code-tab" onclick="switchTab(this,'get-pay-py')">Python</button>
  </div>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre id="get-pay-curl">curl https://api.zivonpay.com/v1/payments/660e8400-e29b-41d4-a716-446655440000 \\
  -u "zp_test_yourKeyId:zp_test_yourKeySecret"</pre>
    <pre id="get-pay-py" style="display:none">resp = requests.get(
    f"https://api.zivonpay.com/v1/payments/{{payment_id}}",
    auth=("zp_test_yourKeyId", "zp_test_yourKeySecret")
)
payment = resp.json()</pre>
  </div>

  <h3>Response <span class="status s2">200</span></h3>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre>{{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "entity": "payment",
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000,
  "currency": "INR",
  "status": "captured",
  "payer_vpa": "user@upi",
  "rrn": "123456789012",
  "transaction_id": "TXN123456",
  "bank_name": "HDFC Bank",
  "error_code": null,
  "error_description": null,
  "created_at": 1709049451,
  "captured_at": 1709049455
}}</pre>
  </div>
</div>
</section>

<section id="list-payments">
<h2>List Payments</h2>
<div class="endpoint">
  <span class="method method-get">GET</span>
  <span class="ep-url">/v1/payments?skip=0&limit=20</span>
  <p class="ep-desc">List all payments for the authenticated merchant.</p>

  <div class="code-tabs">
    <button class="code-tab active" onclick="switchTab(this,'list-pay-curl')">cURL</button>
  </div>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre id="list-pay-curl">curl "https://api.zivonpay.com/v1/payments?skip=0&limit=20" \\
  -u "zp_test_yourKeyId:zp_test_yourKeySecret"</pre>
  </div>
</div>
</section>

<!-- ═══════════ PAYMENT LINKS API ═══════════ -->

<section id="create-intent">
<h2>Create Payment Link</h2>
<div class="endpoint">
  <span class="method method-post">POST</span>
  <span class="ep-url">/v1/payment-intent</span>
  <p class="ep-desc">Create a hosted payment page. Returns a shareable link that your customer can open to pay via UPI.</p>

  <h3>Headers</h3>
  <table class="param-table">
    <tr><th>Header</th><th>Required</th><th>Description</th></tr>
    <tr><td><code>Authorization</code></td><td class="req">Yes</td><td><code>Basic base64(key_id:key_secret)</code></td></tr>
    <tr><td><code>X-Idempotency-Key</code></td><td class="opt">No</td><td>Unique key to prevent duplicates</td></tr>
  </table>

  <h3>Request Body</h3>
  <table class="param-table">
    <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
    <tr><td><code>amount</code></td><td class="type">integer</td><td class="req">Yes</td><td>Amount in paise</td></tr>
    <tr><td><code>currency</code></td><td class="type">string</td><td class="opt">No</td><td>Default: <code>INR</code></td></tr>
    <tr><td><code>order_id</code></td><td class="type">string</td><td class="req">Yes</td><td>Your unique order reference</td></tr>
    <tr><td><code>customer_name</code></td><td class="type">string</td><td class="req">Yes</td><td>Customer name</td></tr>
    <tr><td><code>customer_email</code></td><td class="type">string</td><td class="opt">No</td><td>Customer email</td></tr>
    <tr><td><code>customer_phone</code></td><td class="type">string</td><td class="req">Yes</td><td>10-digit mobile number</td></tr>
    <tr><td><code>expiry_minutes</code></td><td class="type">integer</td><td class="opt">No</td><td>Link expiry (default 15, max 1440)</td></tr>
    <tr><td><code>notes</code></td><td class="type">object</td><td class="opt">No</td><td>Metadata</td></tr>
  </table>

  <div class="code-tabs">
    <button class="code-tab active" onclick="switchTab(this,'create-intent-curl')">cURL</button>
    <button class="code-tab" onclick="switchTab(this,'create-intent-js')">JavaScript</button>
    <button class="code-tab" onclick="switchTab(this,'create-intent-py')">Python</button>
  </div>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre id="create-intent-curl">curl -X POST https://api.zivonpay.com/v1/payment-intent \\
  -u "zp_test_yourKeyId:zp_test_yourKeySecret" \\
  -H "Content-Type: application/json" \\
  -d '{{
    "amount": 100000,
    "order_id": "ORD_789",
    "customer_name": "Suraj Pandya",
    "customer_phone": "9999999999",
    "expiry_minutes": 30
  }}'</pre>
    <pre id="create-intent-js" style="display:none">const credentials = btoa("zp_test_yourKeyId:zp_test_yourKeySecret");
const res = await fetch("https://api.zivonpay.com/v1/payment-intent", {{
  method: "POST",
  headers: {{
    "Authorization": `Basic ${{credentials}}`,
    "Content-Type": "application/json"
  }},
  body: JSON.stringify({{
    amount: 100000,
    order_id: "ORD_789",
    customer_name: "Suraj Pandya",
    customer_phone: "9999999999",
    expiry_minutes: 30
  }})
}});
const intent = await res.json();</pre>
    <pre id="create-intent-py" style="display:none">resp = requests.post(
    "https://api.zivonpay.com/v1/payment-intent",
    auth=("zp_test_yourKeyId", "zp_test_yourKeySecret"),
    json={{
        "amount": 100000,
        "order_id": "ORD_789",
        "customer_name": "Suraj Pandya",
        "customer_phone": "9999999999",
        "expiry_minutes": 30
    }}
)
intent = resp.json()</pre>
  </div>

  <h3>Response <span class="status s2">201</span></h3>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre>{{
  "status": "success",
  "payment_intent_id": "pi_a1b2c3d4e5f6",
  "payment_link": "https://api.zivonpay.com/link/pi_a1b2c3d4e5f6?token=eyJ...",
  "amount": 100000,
  "currency": "INR",
  "order_id": "ORD_789",
  "intent_status": "created",
  "expires_at": "2026-04-10T15:30:00Z",
  "created_at": 1709049451,
  "paid_at": null
}}</pre>
  </div>

  <div class="info-box tip">
    Share the <code>payment_link</code> with your customer. They'll see a hosted checkout page with QR code and UPI intent.
  </div>
</div>
</section>

<section id="get-intent">
<h2>Get Payment Link</h2>
<div class="endpoint">
  <span class="method method-get">GET</span>
  <span class="ep-url">/v1/payment-intent/{{short_id}}</span>
  <p class="ep-desc">Fetch a payment intent by its short ID (e.g. <code>pi_a1b2c3d4e5f6</code>).</p>

  <div class="code-tabs">
    <button class="code-tab active" onclick="switchTab(this,'get-intent-curl')">cURL</button>
  </div>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre id="get-intent-curl">curl https://api.zivonpay.com/v1/payment-intent/pi_a1b2c3d4e5f6 \\
  -u "zp_test_yourKeyId:zp_test_yourKeySecret"</pre>
  </div>
</div>
</section>

<section id="list-intents">
<h2>List Payment Links</h2>
<div class="endpoint">
  <span class="method method-get">GET</span>
  <span class="ep-url">/v1/payment-intent?skip=0&limit=20</span>
  <p class="ep-desc">List all payment intents for the authenticated merchant.</p>

  <div class="code-tabs">
    <button class="code-tab active" onclick="switchTab(this,'list-intent-curl')">cURL</button>
  </div>
  <div class="code-block">
    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    <pre id="list-intent-curl">curl "https://api.zivonpay.com/v1/payment-intent?skip=0&limit=20" \\
  -u "zp_test_yourKeyId:zp_test_yourKeySecret"</pre>
  </div>
</div>
</section>

<!-- ═══════════ WEBHOOKS ═══════════ -->

<section id="webhooks">
<h2>Webhook Events</h2>
<p>ZivonPay sends webhook notifications to your configured URL when payment events occur.</p>

<div class="endpoint">
<table class="param-table">
  <tr><th>Event</th><th>Triggered When</th></tr>
  <tr><td><code>payment.captured</code></td><td>Payment successfully captured</td></tr>
  <tr><td><code>payment.failed</code></td><td>Payment attempt failed</td></tr>
  <tr><td><code>order.paid</code></td><td>Order fully paid</td></tr>
  <tr><td><code>payment.refunded</code></td><td>Payment refunded</td></tr>
</table>
</div>

<h3>Webhook Payload</h3>
<div class="code-block">
<button class="copy-btn" onclick="copyCode(this)">Copy</button>
<pre>{{
  "event": "payment.captured",
  "entity": "payment",
  "entity_id": "660e8400-e29b-41d4-a716-446655440000",
  "data": {{
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "order_id": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 50000,
    "currency": "INR",
    "status": "captured",
    "payer_vpa": "user@upi",
    "rrn": "123456789012"
  }},
  "timestamp": 1709049455
}}</pre>
</div>
</section>

<section id="webhook-verification">
<h2>Webhook Verification</h2>
<p>Verify webhook authenticity using HMAC-SHA256 signature in the <code>X-ZivonPay-Signature</code> header.</p>

<div class="code-block">
<button class="copy-btn" onclick="copyCode(this)">Copy</button>
<pre># Python verification
import hmac, hashlib

def verify_webhook(payload_body: str, signature: str, webhook_secret: str) -> bool:
    expected = hmac.new(
        webhook_secret.encode(),
        payload_body.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)</pre>
</div>

<div class="code-block" style="margin-top:12px">
<button class="copy-btn" onclick="copyCode(this)">Copy</button>
<pre>// Node.js verification
const crypto = require("crypto");

function verifyWebhook(body, signature, secret) {{
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}}</pre>
</div>
</section>

<!-- ═══════════ POSTMAN ═══════════ -->

<section id="postman">
<h2>Postman Collection</h2>
<p>Import the ready-made Postman collection and environment files to test all APIs instantly.</p>

<div class="endpoint">
<table class="param-table">
  <tr><th>File</th><th>Description</th></tr>
  <tr><td><code>ZivonPay.postman_collection.json</code></td><td>All endpoints, pre-configured headers, example bodies</td></tr>
  <tr><td><code>sandbox.postman_environment.json</code></td><td>Sandbox environment variables</td></tr>
  <tr><td><code>production.postman_environment.json</code></td><td>Production environment variables</td></tr>
</table>
</div>

<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px">
  <a href="/v1/developer-docs/postman/collection" download="ZivonPay.postman_collection.json" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:{_ACCENT};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">&#x2B07; Download Collection</a>
  <a href="/v1/developer-docs/postman/sandbox" download="sandbox.postman_environment.json" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:transparent;color:{_ACCENT};border:1px solid {_ACCENT};border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">&#x2B07; Sandbox Environment</a>
  <a href="/v1/developer-docs/postman/production" download="production.postman_environment.json" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:transparent;color:{_ACCENT};border:1px solid {_ACCENT};border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">&#x2B07; Production Environment</a>
</div>
</section>

<section id="sdks">
<h2>SDKs</h2>
<div class="endpoint">
<table class="param-table">
  <tr><th>Language</th><th>Package</th><th>Status</th></tr>
  <tr><td>Python</td><td><code>pip install zivonpay</code></td><td><span class="status s2">Available</span></td></tr>
  <tr><td>Node.js</td><td><code>npm install zivonpay</code></td><td><span class="status s2">Available</span></td></tr>
  <tr><td>Go</td><td><code>go get zivonpay.com/sdk/go</code></td><td><span class="status s2">Available</span></td></tr>
  <tr><td>PHP</td><td><code>composer require zivonpay/zivonpay</code></td><td><span class="status s2">Available</span></td></tr>
  <tr><td>Java</td><td>Maven: <code>com.zivonpay:zivonpay-java</code></td><td><span class="status s2">Available</span></td></tr>
</table>
</div>
</section>

<div style="text-align:center;padding:60px 0 20px;color:{_MUTED};font-size:13px">
  &copy; 2026 ZivonPay &middot; v1.0.0 &middot;
  <a href="https://zivonpay.com" style="color:{_ACCENT};text-decoration:none">zivonpay.com</a>
</div>

</main>
</div>

<script>
// ── Copy to clipboard ──
function copyCode(btn){{
  const pre=btn.parentElement.querySelector('pre:not([style*=\"display:none\"])') || btn.parentElement.querySelector('pre');
  navigator.clipboard.writeText(pre.textContent).then(()=>{{
    btn.textContent='Copied!';
    setTimeout(()=>btn.textContent='Copy',2000);
  }});
}}

// ── Code language tabs ──
function switchTab(btn,id){{
  const tabs=btn.parentElement;
  const block=tabs.nextElementSibling;
  tabs.querySelectorAll('.code-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  block.querySelectorAll('pre').forEach(p=>p.style.display='none');
  document.getElementById(id).style.display='block';
}}

// ── Sidebar active state ──
const links=document.querySelectorAll('.nav-link');
const observer=new IntersectionObserver(entries=>{{
  entries.forEach(e=>{{
    if(e.isIntersecting){{
      links.forEach(l=>l.classList.remove('active'));
      const link=document.querySelector(`.nav-link[href="#${{e.target.id}}"]`);
      if(link) link.classList.add('active');
    }}
  }});
}},{{rootMargin:'-20% 0px -70% 0px'}});
document.querySelectorAll('section[id]').forEach(s=>observer.observe(s));

// ── Environment switcher ──
function setEnv(env){{
  document.querySelectorAll('.env-btn').forEach(b=>b.classList.remove('active'));
  event.target.classList.add('active');
}}
</script>
</body>
</html>"""


@router.get("", response_class=HTMLResponse, include_in_schema=False)
async def developer_docs(request: Request):
    """Serve the developer documentation page"""
    return HTMLResponse(content=_docs_page())


_POSTMAN_FILES = {
    "collection": "ZivonPay.postman_collection.json",
    "sandbox": "sandbox.postman_environment.json",
    "production": "production.postman_environment.json",
}


@router.get("/postman/{file_type}", include_in_schema=False)
async def download_postman_file(file_type: str):
    """Download Postman collection or environment files"""
    if file_type not in _POSTMAN_FILES:
        return HTMLResponse(content="Not found", status_code=404)
    file_path = _POSTMAN_DIR / _POSTMAN_FILES[file_type]
    if not file_path.is_file():
        return HTMLResponse(content="File not found", status_code=404)
    return FileResponse(
        path=str(file_path),
        filename=_POSTMAN_FILES[file_type],
        media_type="application/json",
    )
