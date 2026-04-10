"""
Public Payment Link Endpoints
Mounted at  /link  (outside /v1 — no merchant auth required).

  GET  /link/{short_id}            → HTML hosted payment page
  GET  /link/{short_id}/qr         → QR code PNG
  GET  /link/{short_id}/status     → JSON status (polled by the page)
  POST /link/{short_id}/webhook    → SprintNXT callback
"""

from fastapi import APIRouter, Depends, Query, Request, HTTPException, status
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import io
import qrcode
import logging

from app.database import get_db
from app.core.security import verify_token
from app.services.payment_intent import payment_intent_service, PaymentIntentStatus
from app.core.exceptions import ValidationError
from app.config import get_base_url

logger = logging.getLogger(__name__)

router = APIRouter()


# ── helpers ────────────────────────────────────────────────────────────────────

def _validate_link_token(token: str, short_id: str) -> dict:
    """Verify the JWT link token and ensure it matches the short_id."""
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=403, detail="Invalid or expired payment link")
    if payload.get("sub") != short_id or payload.get("type") != "payment_link":
        raise HTTPException(status_code=403, detail="Token does not match this payment link")
    return payload


# ── Hosted Payment Page ────────────────────────────────────────────────────────

@router.get(
    "/{short_id}",
    response_class=HTMLResponse,
    summary="Hosted Payment Page",
    description="Public payment page for the customer",
    include_in_schema=False,
)
async def payment_page(
    short_id: str,
    token: str = Query(..., description="Signed link token"),
    db: AsyncSession = Depends(get_db),
):
    """
    Render the hosted payment page.
    1. Validate token  2. Check expiry  3. Initiate UPI via SprintNXT  4. Show page.
    """
    _validate_link_token(token, short_id)

    intent = await payment_intent_service.get_intent_by_short_id(short_id, db)
    if not intent:
        raise HTTPException(status_code=404, detail="Payment link not found")

    # Check expiry
    intent = await payment_intent_service.expire_if_needed(intent, db)
    if intent.status == PaymentIntentStatus.EXPIRED:
        return HTMLResponse(content=_expired_page(short_id), status_code=410)
    if intent.status == PaymentIntentStatus.SUCCESS:
        return HTMLResponse(content=_success_page(short_id), status_code=200)

    # Initiate SprintNXT UPI if not done yet
    try:
        intent = await payment_intent_service.initiate_payment(intent, db)
    except Exception as e:
        logger.error("SprintNXT initiation failed on payment page", extra={"short_id": short_id, "error": str(e)})
        return HTMLResponse(content=_error_page(short_id, str(e)), status_code=502)

    page_data = payment_intent_service.intent_to_page_data(intent)
    base_url = get_base_url()

    html = _render_payment_page(page_data, base_url, token)
    return HTMLResponse(content=html, status_code=200)


# ── QR Code Image ──────────────────────────────────────────────────────────────

@router.get(
    "/{short_id}/qr",
    summary="Payment Intent QR Code",
    responses={200: {"content": {"image/png": {}}}},
)
async def payment_intent_qr(
    short_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    _validate_link_token(token, short_id)

    intent = await payment_intent_service.get_intent_by_short_id(short_id, db)
    if not intent or not intent.upi_intent_url:
        raise HTTPException(status_code=404, detail="QR not available")

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(intent.upi_intent_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")


# ── Status polling (AJAX from page) ───────────────────────────────────────────

@router.get(
    "/{short_id}/status",
    summary="Payment Intent Status",
    description="Lightweight JSON status endpoint polled by the payment page",
)
async def payment_intent_status(
    short_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    _validate_link_token(token, short_id)

    intent = await payment_intent_service.get_intent_by_short_id(short_id, db)
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")

    intent = await payment_intent_service.expire_if_needed(intent, db)

    return {
        "payment_intent_id": intent.short_id,
        "status": intent.status.value,
        "paid_at": int(intent.paid_at.timestamp()) if intent.paid_at else None,
    }


# ── SprintNXT Webhook ─────────────────────────────────────────────────────────

@router.post(
    "/{short_id}/webhook",
    summary="Payment Intent Webhook Callback",
    description="Called by SprintNXT when payment status changes",
)
async def payment_intent_webhook(
    short_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    SprintNXT calls back with payment status.
    Expected payload keys: statusvalue, payer_vpa, rrn, bank_name, etc.
    """
    body = await request.json()

    logger.info(
        "Payment intent webhook received",
        extra={"short_id": short_id, "body": body},
    )

    intent = await payment_intent_service.get_intent_by_short_id(short_id, db)
    if not intent:
        return JSONResponse(status_code=404, content={"error": "Intent not found"})

    status_value = body.get("statusvalue")

    if status_value == 1:  # Success
        await payment_intent_service.mark_success(
            intent,
            payer_vpa=body.get("payer_vpa"),
            rrn=body.get("rrn"),
            bank_name=body.get("bank_name"),
            db=db,
        )
    elif status_value in (0, 2):  # Failed
        await payment_intent_service.mark_failed(
            intent,
            error_code=body.get("error_code"),
            error_description=body.get("error_description"),
            db=db,
        )

    return {"status": "ok"}


# ═══════════════════════════════════════════════════════════════════════════════
# HTML templates (inline — no Jinja dependency needed)
# ═══════════════════════════════════════════════════════════════════════════════

def _render_payment_page(page_data, base_url: str, token: str) -> str:
    amount_rupees = page_data.amount / 100
    qr_url = f"{base_url}/link/{page_data.payment_intent_id}/qr?token={token}"
    status_url = f"{base_url}/link/{page_data.payment_intent_id}/status?token={token}"
    upi_url = page_data.upi_intent_url or ""

    # Format amount for display  (₹1,234.56)
    amt_whole = int(amount_rupees)
    amt_dec   = int(round((amount_rupees - amt_whole) * 100))
    amt_formatted = f"{{:,}}".format(amt_whole)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pay ₹{amount_rupees:.2f} — ZivonPay</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{{margin:0;padding:0;box-sizing:border-box}}
:root{{
  --primary:#6366f1;--primary-dark:#4f46e5;--primary-light:#818cf8;
  --success:#10b981;--success-bg:#ecfdf5;--success-border:#a7f3d0;
  --error:#ef4444;--error-bg:#fef2f2;--error-border:#fecaca;
  --warn:#f59e0b;--warn-bg:#fffbeb;--warn-border:#fde68a;
  --gray-50:#f9fafb;--gray-100:#f3f4f6;--gray-200:#e5e7eb;--gray-300:#d1d5db;
  --gray-400:#9ca3af;--gray-500:#6b7280;--gray-600:#4b5563;--gray-700:#374151;
  --gray-800:#1f2937;--gray-900:#111827;
  --radius:12px;--radius-lg:16px;--radius-xl:20px;
  --shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06);
  --shadow-lg:0 4px 6px rgba(0,0,0,.04),0 10px 40px rgba(0,0,0,.08);
  --shadow-xl:0 8px 30px rgba(0,0,0,.12);
}}
html{{height:100%}}
body{{
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 30%,#f5f3ff 60%,#ede9fe 100%);
  min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:16px;
}}

/* ─── Main card ───────────────────────────────────── */
.checkout{{
  background:#fff;border-radius:var(--radius-xl);box-shadow:var(--shadow-xl);
  width:100%;max-width:440px;overflow:hidden;position:relative;
}}

/* Top gradient accent bar */
.checkout::before{{
  content:'';position:absolute;top:0;left:0;right:0;height:4px;
  background:linear-gradient(90deg,var(--primary),var(--primary-light),#a78bfa);
}}

/* ─── Header ──────────────────────────────────────── */
.header{{padding:28px 28px 0;display:flex;align-items:center;justify-content:space-between}}
.brand{{display:flex;align-items:center;gap:10px}}
.brand-icon{{
  width:38px;height:38px;border-radius:10px;
  background:linear-gradient(135deg,var(--primary),var(--primary-light));
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 2px 8px rgba(99,102,241,.3);
}}
.brand-icon svg{{width:20px;height:20px}}
.brand-name{{font-size:18px;font-weight:700;color:var(--gray-900)}}
.secure-badge{{
  display:flex;align-items:center;gap:4px;font-size:11px;font-weight:500;
  color:var(--success);background:var(--success-bg);padding:4px 10px;
  border-radius:20px;border:1px solid var(--success-border);
}}
.secure-badge svg{{width:12px;height:12px}}

/* ─── Amount section ──────────────────────────────── */
.amount-section{{padding:24px 28px 20px;text-align:center}}
.amount-label{{font-size:12px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}}
.amount-row{{display:flex;align-items:flex-start;justify-content:center;gap:2px}}
.amount-currency{{font-size:22px;font-weight:700;color:var(--gray-400);margin-top:6px}}
.amount-value{{font-size:48px;font-weight:800;color:var(--gray-900);line-height:1;letter-spacing:-.02em}}
.amount-decimal{{font-size:22px;font-weight:700;color:var(--gray-400);margin-top:6px}}

/* ─── Order details ───────────────────────────────── */
.details{{margin:0 28px;padding:16px;background:var(--gray-50);border-radius:var(--radius);border:1px solid var(--gray-100)}}
.detail-row{{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px}}
.detail-row:not(:last-child){{border-bottom:1px solid var(--gray-100)}}
.detail-label{{color:var(--gray-500);font-weight:500}}
.detail-value{{color:var(--gray-800);font-weight:600;text-align:right;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}

/* ─── Divider with text ───────────────────────────── */
.divider-text{{display:flex;align-items:center;gap:12px;margin:24px 28px 20px;font-size:12px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.06em}}
.divider-text::before,.divider-text::after{{content:'';flex:1;height:1px;background:var(--gray-200)}}

/* ─── QR section ──────────────────────────────────── */
.qr-section{{text-align:center;padding:0 28px}}
.qr-container{{
  display:inline-block;padding:12px;background:#fff;border-radius:var(--radius-lg);
  border:2px solid var(--gray-200);box-shadow:0 2px 12px rgba(0,0,0,.04);
  position:relative;transition:border-color .3s;
}}
.qr-container:hover{{border-color:var(--primary-light)}}
.qr-container img{{width:180px;height:180px;display:block;border-radius:8px}}
.qr-label{{margin-top:12px;font-size:12px;color:var(--gray-500);font-weight:500}}
.qr-label svg{{width:14px;height:14px;vertical-align:-2px;margin-right:4px}}

/* ─── OR divider ──────────────────────────────────── */
.or-divider{{display:flex;align-items:center;gap:12px;margin:20px 28px;font-size:11px;font-weight:600;color:var(--gray-400);text-transform:uppercase;letter-spacing:.1em}}
.or-divider::before,.or-divider::after{{content:'';flex:1;height:1px;background:var(--gray-200)}}

/* ─── UPI button ──────────────────────────────────── */
.actions{{padding:0 28px 24px}}
.btn-upi{{
  display:flex;align-items:center;justify-content:center;gap:10px;
  width:100%;padding:14px 20px;border:none;border-radius:var(--radius);
  font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;
  background:linear-gradient(135deg,var(--primary),var(--primary-dark));
  color:#fff;text-decoration:none;transition:all .2s;
  box-shadow:0 2px 8px rgba(99,102,241,.3);
}}
.btn-upi:hover{{transform:translateY(-1px);box-shadow:0 4px 16px rgba(99,102,241,.4)}}
.btn-upi:active{{transform:translateY(0)}}
.btn-upi svg{{width:20px;height:20px}}

/* ─── Status bar ──────────────────────────────────── */
.status-bar{{
  margin:0 28px 24px;padding:12px 16px;border-radius:var(--radius);
  display:flex;align-items:center;gap:10px;font-size:13px;font-weight:500;
  transition:all .4s ease;
}}
.status-pending{{background:var(--warn-bg);color:#92400e;border:1px solid var(--warn-border)}}
.status-success{{background:var(--success-bg);color:#065f46;border:1px solid var(--success-border)}}
.status-failed{{background:var(--error-bg);color:#991b1b;border:1px solid var(--error-border)}}
.status-expired{{background:var(--gray-100);color:var(--gray-500);border:1px solid var(--gray-200)}}

/* Pulsing dot animation */
.pulse-dot{{
  width:8px;height:8px;border-radius:50%;flex-shrink:0;
}}
.status-pending .pulse-dot{{background:var(--warn);animation:pulse 2s ease-in-out infinite}}
.status-success .pulse-dot{{background:var(--success)}}
.status-failed .pulse-dot{{background:var(--error)}}
.status-expired .pulse-dot{{background:var(--gray-400)}}

@keyframes pulse{{
  0%,100%{{opacity:1;transform:scale(1)}}
  50%{{opacity:.5;transform:scale(.7)}}
}}

/* ─── Timer ───────────────────────────────────────── */
.timer{{
  text-align:center;padding:0 28px 20px;font-size:12px;color:var(--gray-400);
  display:flex;align-items:center;justify-content:center;gap:6px;
}}
.timer svg{{width:14px;height:14px}}
.timer-value{{font-weight:600;color:var(--gray-600);font-variant-numeric:tabular-nums}}
.timer-urgent .timer-value{{color:var(--error)}}

/* ─── Footer ──────────────────────────────────────── */
.footer{{
  padding:16px 28px;background:var(--gray-50);border-top:1px solid var(--gray-100);
  display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;
}}
.footer-item{{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--gray-400);font-weight:500}}
.footer-item svg{{width:12px;height:12px;color:var(--gray-300)}}

/* ─── Success overlay ─────────────────────────────── */
.overlay{{
  display:none;position:absolute;inset:0;background:rgba(255,255,255,.96);
  z-index:10;flex-direction:column;align-items:center;justify-content:center;
  border-radius:var(--radius-xl);
}}
.overlay.active{{display:flex}}
.overlay-icon{{
  width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  margin-bottom:16px;
}}
.overlay-icon.success{{background:var(--success-bg);color:var(--success)}}
.overlay-icon.failed{{background:var(--error-bg);color:var(--error)}}
.overlay-icon svg{{width:36px;height:36px}}
.overlay-title{{font-size:20px;font-weight:700;color:var(--gray-900);margin-bottom:4px}}
.overlay-text{{font-size:14px;color:var(--gray-500);text-align:center;max-width:280px}}

/* ─── Responsive ──────────────────────────────────── */
@media(max-width:480px){{
  body{{padding:8px;justify-content:flex-start;padding-top:24px}}
  .checkout{{border-radius:var(--radius-lg)}}
  .checkout::before{{border-radius:var(--radius-lg) var(--radius-lg) 0 0}}
  .header{{padding:20px 20px 0}}
  .amount-section{{padding:20px 20px 16px}}
  .amount-value{{font-size:40px}}
  .details,.divider-text,.qr-section,.or-divider,.actions,.status-bar,.timer{{
    margin-left:20px;margin-right:20px;padding-left:20px;padding-right:20px;
  }}
  .details,.status-bar{{margin-left:20px;margin-right:20px;padding:12px}}
  .qr-container img{{width:150px;height:150px}}
  .footer{{padding:14px 20px}}
}}
</style>
</head>
<body>

<div class="checkout">
  <!-- Success / Failed overlay -->
  <div class="overlay" id="overlay">
    <div class="overlay-icon" id="overlayIcon"><svg id="overlaySvg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></svg></div>
    <div class="overlay-title" id="overlayTitle"></div>
    <div class="overlay-text" id="overlayText"></div>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
      <span class="brand-name">ZivonPay</span>
    </div>
    <div class="secure-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      Secure
    </div>
  </div>

  <!-- Amount -->
  <div class="amount-section">
    <div class="amount-label">Total Amount</div>
    <div class="amount-row">
      <span class="amount-currency">₹</span>
      <span class="amount-value">{amt_formatted}</span>
      <span class="amount-decimal">.{amt_dec:02d}</span>
    </div>
  </div>

  <!-- Order details -->
  <div class="details">
    <div class="detail-row"><span class="detail-label">Customer</span><span class="detail-value">{page_data.customer_name}</span></div>
    <div class="detail-row"><span class="detail-label">Order ID</span><span class="detail-value">{page_data.order_id}</span></div>
    <div class="detail-row"><span class="detail-label">Currency</span><span class="detail-value">{page_data.currency}</span></div>
  </div>

  <!-- QR Code -->
  <div class="divider-text">Scan QR to pay</div>
  <div class="qr-section">
    <div class="qr-container"><img src="{qr_url}" alt="Scan to Pay" id="qrImg"></div>
    <div class="qr-label">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 12a11.05 11.05 0 0 0-22 0zm0 0a11.05 11.05 0 0 1-22 0zm11-6v6l4 2"/></svg>
      Open any UPI app and scan
    </div>
  </div>

  <!-- OR -->
  <div class="or-divider">or</div>

  <!-- UPI button -->
  <div class="actions">
    <a class="btn-upi" href="{upi_url}" id="payBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
      Pay ₹{amount_rupees:.2f} with UPI
    </a>
  </div>

  <!-- Status -->
  <div id="statusBar" class="status-bar status-pending">
    <span class="pulse-dot"></span>
    <span id="statusText">Waiting for payment…</span>
  </div>

  <!-- Timer -->
  <div class="timer" id="timerWrap">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    Expires in <span class="timer-value" id="timerValue">--:--</span>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      256-bit SSL
    </div>
    <div class="footer-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      PCI DSS Compliant
    </div>
    <div class="footer-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Powered by ZivonPay
    </div>
  </div>
</div>

<script>
(function(){{
  const STATUS_URL  = "{status_url}";
  const EXPIRES_AT  = new Date("{page_data.expires_at}");
  const bar         = document.getElementById('statusBar');
  const statusText  = document.getElementById('statusText');
  const timerValue  = document.getElementById('timerValue');
  const timerWrap   = document.getElementById('timerWrap');
  const overlay     = document.getElementById('overlay');
  const overlayIcon = document.getElementById('overlayIcon');
  const overlaySvg  = document.getElementById('overlaySvg');
  const overlayTitle= document.getElementById('overlayTitle');
  const overlayText = document.getElementById('overlayText');

  /* ── Countdown timer ── */
  function updateTimer(){{
    const now  = new Date();
    const diff = EXPIRES_AT - now;
    if(diff <= 0){{
      timerValue.textContent = '00:00';
      timerWrap.classList.add('timer-urgent');
      return;
    }}
    const m = Math.floor(diff/60000);
    const s = Math.floor((diff%60000)/1000);
    timerValue.textContent = String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
    if(diff < 120000) timerWrap.classList.add('timer-urgent');
  }}
  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);

  /* ── Show overlay ── */
  function showOverlay(type, title, text){{
    overlayIcon.className = 'overlay-icon ' + type;
    if(type === 'success'){{
      overlaySvg.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
    }} else {{
      overlaySvg.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    }}
    overlayTitle.textContent = title;
    overlayText.textContent  = text;
    overlay.classList.add('active');
  }}

  /* ── Poll status ── */
  const poll = setInterval(async () => {{
    try {{
      const r = await fetch(STATUS_URL);
      const d = await r.json();
      if(d.status === 'success'){{
        bar.className     = 'status-bar status-success';
        statusText.textContent = 'Payment received!';
        clearInterval(poll);
        clearInterval(timerInterval);
        document.getElementById('payBtn').style.display = 'none';
        timerWrap.style.display = 'none';
        setTimeout(()=>showOverlay('success','Payment Successful','Your payment of ₹{amount_rupees:.2f} has been received successfully.'),600);
      }} else if(d.status === 'failed'){{
        bar.className     = 'status-bar status-failed';
        statusText.textContent = 'Payment failed. Please try again.';
        clearInterval(poll);
        clearInterval(timerInterval);
        setTimeout(()=>showOverlay('failed','Payment Failed','Something went wrong. Please try again or contact the merchant.'),600);
      }} else if(d.status === 'expired'){{
        bar.className     = 'status-bar status-expired';
        statusText.textContent = 'This payment link has expired.';
        clearInterval(poll);
        clearInterval(timerInterval);
        document.getElementById('payBtn').style.display = 'none';
        timerWrap.style.display = 'none';
      }}
    }} catch(e){{}}
  }}, 3000);
}})();
</script>
</body>
</html>"""


def _expired_page(short_id: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link Expired — ZivonPay</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:'Inter',system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;
  background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 30%,#f5f3ff 60%,#ede9fe 100%);padding:16px}}
.card{{background:#fff;border-radius:20px;box-shadow:0 8px 30px rgba(0,0,0,.12);max-width:420px;width:100%;padding:48px 36px;text-align:center;position:relative;overflow:hidden}}
.card::before{{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#ef4444,#f87171)}}
.icon{{width:64px;height:64px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}}
.icon svg{{width:32px;height:32px;color:#ef4444}}
h2{{font-size:20px;font-weight:700;color:#111827;margin-bottom:8px}}
p{{color:#6b7280;font-size:14px;line-height:1.6}}
strong{{color:#374151}}
</style>
</head>
<body>
<div class="card">
  <div class="icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  </div>
  <h2>Payment Link Expired</h2>
  <p>The payment link <strong>{short_id}</strong> has expired.<br>Please request a new link from the merchant.</p>
</div>
</body></html>"""


def _success_page(short_id: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Payment Successful — ZivonPay</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:'Inter',system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;
  background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 30%,#f5f3ff 60%,#ede9fe 100%);padding:16px}}
.card{{background:#fff;border-radius:20px;box-shadow:0 8px 30px rgba(0,0,0,.12);max-width:420px;width:100%;padding:48px 36px;text-align:center;position:relative;overflow:hidden}}
.card::before{{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#10b981,#34d399)}}
.icon{{width:72px;height:72px;border-radius:50%;background:#ecfdf5;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}}
.icon svg{{width:36px;height:36px;color:#10b981}}
h2{{font-size:20px;font-weight:700;color:#111827;margin-bottom:8px}}
p{{color:#6b7280;font-size:14px;line-height:1.6}}
strong{{color:#374151}}
</style>
</head>
<body>
<div class="card">
  <div class="icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  </div>
  <h2>Payment Successful</h2>
  <p>Your payment for <strong>{short_id}</strong> has been received.<br>You may close this page.</p>
</div>
</body></html>"""


def _error_page(short_id: str, error: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Error — ZivonPay</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:'Inter',system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;
  background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 30%,#f5f3ff 60%,#ede9fe 100%);padding:16px}}
.card{{background:#fff;border-radius:20px;box-shadow:0 8px 30px rgba(0,0,0,.12);max-width:420px;width:100%;padding:48px 36px;text-align:center;position:relative;overflow:hidden}}
.card::before{{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#ef4444,#f87171)}}
.icon{{width:64px;height:64px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}}
.icon svg{{width:32px;height:32px;color:#ef4444}}
h2{{font-size:20px;font-weight:700;color:#111827;margin-bottom:8px}}
p{{color:#6b7280;font-size:14px;line-height:1.6}}
strong{{color:#374151}}
</style>
</head>
<body>
<div class="card">
  <div class="icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  </div>
  <h2>Payment Error</h2>
  <p>Could not initiate payment for <strong>{short_id}</strong>.<br>Please try again later.</p>
</div>
</body></html>"""
