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
    request: Request,
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
    # Use the actual request origin so QR/status URLs work on any host
    base_url = str(request.base_url).rstrip("/")

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

import base64 as _b64
from pathlib import Path as _Path

def _load_logo_b64() -> str:
    """Load the ZivonPay logo as a base64 string."""
    # __file__ = backend/app/api/v1/endpoints/payment_link.py → parents[5] = workspace root
    _root = _Path(__file__).resolve().parents[5]
    _candidates = [
        _root / "zivonpay-gateway" / "src" / "assets" / "zivonpay-logo.png",
        _root / "New_zivon" / "zivonpay-gateway" / "src" / "assets" / "zivonpay-logo.png",
    ]
    for p in _candidates:
        if p.exists():
            return _b64.b64encode(p.read_bytes()).decode()
    return ""

ZIVON_LOGO_B64 = _load_logo_b64()

def _render_payment_page(page_data, base_url: str, token: str) -> str:
    amount_rupees = page_data.amount / 100
    qr_url = f"{base_url}/link/{page_data.payment_intent_id}/qr?token={token}"
    status_url = f"{base_url}/link/{page_data.payment_intent_id}/status?token={token}"
    upi_url = page_data.upi_intent_url or ""

    amt_whole = int(amount_rupees)
    amt_dec   = int(round((amount_rupees - amt_whole) * 100))
    amt_formatted = f"{{:,}}".format(amt_whole)

    # Detect sandbox mode
    from app.config import settings as _s
    is_sandbox = _s.ENVIRONMENT != "production"

    sandbox_banner = ""
    sandbox_test_section = ""
    if is_sandbox:
        sandbox_banner = '<div class="z-sandbox"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M5.07 19h13.86c1.5 0 2.47-1.6 1.73-2.88L13.73 4.27c-.75-1.3-2.71-1.3-3.46 0L3.34 16.12C2.6 17.4 3.57 19 5.07 19z"/></svg> SANDBOX MODE — Test Environment</div>'
        sandbox_test_section = f"""
  <div class="z-test">
    <div class="z-test-head" onclick="this.parentElement.classList.toggle(\'open\')">
      <div class="z-test-hl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Test Credentials</div>
      <svg class="z-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div class="z-test-body">
      <div class="z-tg">
        <div class="z-tg-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> UPI</div>
        <div class="z-ti"><span>VPA</span><code>success@upi</code></div>
        <div class="z-ti"><span>Fail VPA</span><code>failure@upi</code></div>
      </div>
      <div class="z-tg">
        <div class="z-tg-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg> Card</div>
        <div class="z-ti"><span>Number</span><code>4111 1111 1111 1111</code></div>
        <div class="z-ti"><span>Expiry</span><code>12/29</code></div>
        <div class="z-ti"><span>CVV</span><code>123</code></div>
      </div>
      <div class="z-tg">
        <div class="z-tg-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> Netbanking</div>
        <div class="z-ti"><span>OTP</span><code>123456</code></div>
      </div>
    </div>
  </div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pay ₹{amount_rupees:.2f} — ZivonPay</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{{margin:0;padding:0;box-sizing:border-box}}
:root{{
  --z-primary:#1a56db;--z-primary-hover:#1e40af;--z-primary-50:#eff6ff;--z-primary-100:#dbeafe;
  --z-accent:#06b6d4;--z-accent-dark:#0891b2;
  --z-success:#059669;--z-success-bg:#ecfdf5;--z-success-ring:#a7f3d0;
  --z-danger:#dc2626;--z-danger-bg:#fef2f2;--z-danger-ring:#fecaca;
  --z-warn:#d97706;--z-warn-bg:#fffbeb;--z-warn-ring:#fde68a;
  --z-g50:#f8fafc;--z-g100:#f1f5f9;--z-g200:#e2e8f0;--z-g300:#cbd5e1;
  --z-g400:#94a3b8;--z-g500:#64748b;--z-g600:#475569;--z-g700:#334155;
  --z-g800:#1e293b;--z-g900:#0f172a;
  --z-r:12px;--z-r2:16px;--z-r3:24px;
  --z-shadow:0 0 0 1px rgba(0,0,0,.03),0 1px 2px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.06);
  --z-shadow-lg:0 0 0 1px rgba(0,0,0,.02),0 4px 12px rgba(0,0,0,.04),0 24px 48px rgba(0,0,0,.08);
}}
html{{height:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}}
body{{
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  background:var(--z-g100);min-height:100vh;
  display:flex;align-items:center;justify-content:center;
  padding:20px;position:relative;overflow-x:hidden;
}}
body::before{{
  content:'';position:fixed;top:-40%;left:-20%;width:80%;height:80%;
  background:radial-gradient(circle,rgba(26,86,219,.06) 0%,transparent 70%);
  pointer-events:none;z-index:0;
}}
body::after{{
  content:'';position:fixed;bottom:-30%;right:-15%;width:60%;height:60%;
  background:radial-gradient(circle,rgba(6,182,212,.05) 0%,transparent 70%);
  pointer-events:none;z-index:0;
}}

/* ═══ SANDBOX ══════════════════════════════════════ */
.z-sandbox{{
  position:fixed;top:0;left:0;right:0;z-index:999;
  background:linear-gradient(135deg,#f59e0b 0%,#ea580c 100%);
  color:#fff;text-align:center;padding:6px 16px;
  font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;
  display:flex;align-items:center;justify-content:center;gap:6px;
  box-shadow:0 2px 8px rgba(245,158,11,.3);
}}
.z-sandbox svg{{opacity:.8}}

/* ═══ MAIN CONTAINER ══════════════════════════════ */
.z-checkout{{
  position:relative;z-index:1;width:100%;max-width:480px;
  background:#fff;border-radius:var(--z-r3);
  box-shadow:var(--z-shadow-lg);overflow:hidden;
  animation:fadeUp .5s cubic-bezier(.16,1,.3,1);
}}
@keyframes fadeUp{{from{{opacity:0;transform:translateY(16px)}}to{{opacity:1;transform:none}}}}

/* ═══ HEADER ══════════════════════════════════════ */
.z-head{{
  background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);
  padding:28px 32px 24px;color:#fff;position:relative;overflow:hidden;
}}
.z-head::before{{
  content:'';position:absolute;top:-50%;right:-20%;width:200px;height:200px;
  background:radial-gradient(circle,rgba(6,182,212,.15) 0%,transparent 70%);
  pointer-events:none;
}}
.z-head::after{{
  content:'';position:absolute;bottom:-30%;left:-10%;width:150px;height:150px;
  background:radial-gradient(circle,rgba(26,86,219,.12) 0%,transparent 70%);
  pointer-events:none;
}}
.z-head-top{{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;position:relative;z-index:1}}
.z-brand{{display:flex;align-items:center;gap:12px}}
.z-logo{{
  width:44px;height:44px;border-radius:12px;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.08);
  display:flex;align-items:center;justify-content:center;
  backdrop-filter:blur(8px);overflow:hidden;
}}
.z-logo img{{width:100%;height:100%;object-fit:contain;padding:5px;filter:brightness(1.1)}}
.z-brand-info{{}}
.z-brand-name{{font-size:18px;font-weight:800;letter-spacing:-.01em}}
.z-verified{{
  display:inline-flex;align-items:center;gap:3px;margin-top:2px;
  font-size:10px;font-weight:600;color:rgba(255,255,255,.5);
}}
.z-verified svg{{width:10px;height:10px;color:#34d399}}
.z-secure-chip{{
  display:flex;align-items:center;gap:5px;padding:6px 12px;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);
  border-radius:20px;font-size:11px;font-weight:600;color:rgba(255,255,255,.6);
  backdrop-filter:blur(8px);
}}
.z-secure-chip svg{{width:11px;height:11px;color:#34d399}}

.z-amount-block{{text-align:center;position:relative;z-index:1}}
.z-amount-label{{font-size:11px;font-weight:600;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}}
.z-amount{{font-size:52px;font-weight:900;letter-spacing:-2px;line-height:1}}
.z-amount .z-cur{{font-size:28px;font-weight:700;opacity:.5;vertical-align:top;margin-right:2px;line-height:1.8}}
.z-amount .z-dec{{font-size:22px;font-weight:600;opacity:.4;vertical-align:top;line-height:1.8}}
.z-order-chip{{
  display:inline-flex;align-items:center;gap:6px;margin-top:12px;
  padding:5px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.06);
  border-radius:20px;font-size:11px;color:rgba(255,255,255,.4);font-weight:500;
}}
.z-order-chip code{{color:rgba(255,255,255,.7);font-weight:700;font-family:'Inter',monospace;font-size:10px}}

/* ═══ BODY ════════════════════════════════════════ */
.z-body{{padding:0}}

/* ── Payment method tabs ── */
.z-tabs{{
  display:flex;border-bottom:1px solid var(--z-g200);background:var(--z-g50);
  padding:0 8px;overflow-x:auto;-webkit-overflow-scrolling:touch;
}}
.z-tab{{
  flex:1;min-width:0;padding:14px 8px 12px;font-size:11px;font-weight:600;
  color:var(--z-g400);text-align:center;cursor:pointer;position:relative;
  transition:color .2s;border:none;background:none;font-family:inherit;
  white-space:nowrap;
}}
.z-tab:hover{{color:var(--z-g600)}}
.z-tab.active{{color:var(--z-primary)}}
.z-tab::after{{
  content:'';position:absolute;bottom:0;left:20%;right:20%;height:2.5px;
  background:var(--z-primary);border-radius:2px 2px 0 0;
  transform:scaleX(0);transition:transform .25s cubic-bezier(.4,0,.2,1);
}}
.z-tab.active::after{{transform:scaleX(1)}}
.z-tab-icon{{display:block;margin:0 auto 4px;width:20px;height:20px;color:inherit}}
.z-tab.active .z-tab-icon{{color:var(--z-primary)}}

/* ── Tab panels ── */
.z-panel{{display:none;padding:24px 28px}}
.z-panel.active{{display:block;animation:panelIn .3s ease}}
@keyframes panelIn{{from{{opacity:0;transform:translateY(6px)}}to{{opacity:1;transform:none}}}}

/* ── QR Section ── */
.z-qr-wrap{{display:flex;gap:20px;align-items:flex-start}}
.z-qr-frame{{
  flex:0 0 auto;position:relative;padding:8px;
  background:#fff;border-radius:var(--z-r2);
  border:1.5px solid var(--z-g200);
  box-shadow:0 2px 8px rgba(0,0,0,.04);
  transition:all .3s;
}}
.z-qr-frame:hover{{border-color:var(--z-primary);box-shadow:0 4px 16px rgba(26,86,219,.1)}}
.z-qr-frame img{{width:140px;height:140px;display:block;border-radius:10px}}
.z-qr-corner{{position:absolute;width:16px;height:16px;border-color:var(--z-primary);}}
.z-qr-corner.tl{{top:0;left:0;border-top:3px solid;border-left:3px solid;border-radius:var(--z-r2) 0 0 0}}
.z-qr-corner.tr{{top:0;right:0;border-top:3px solid;border-right:3px solid;border-radius:0 var(--z-r2) 0 0}}
.z-qr-corner.bl{{bottom:0;left:0;border-bottom:3px solid;border-left:3px solid;border-radius:0 0 0 var(--z-r2)}}
.z-qr-corner.br{{bottom:0;right:0;border-bottom:3px solid;border-right:3px solid;border-radius:0 0 var(--z-r2) 0}}

.z-qr-steps{{flex:1;min-width:0}}
.z-step{{display:flex;align-items:flex-start;gap:10px;margin-bottom:14px}}
.z-step:last-child{{margin-bottom:0}}
.z-step-n{{
  flex:0 0 24px;height:24px;border-radius:50%;font-size:11px;font-weight:700;
  display:flex;align-items:center;justify-content:center;
  background:var(--z-primary-50);color:var(--z-primary);border:1.5px solid var(--z-primary-100);
}}
.z-step p{{font-size:13px;color:var(--z-g600);line-height:24px;font-weight:500}}

.z-upi-row{{display:flex;gap:6px;margin-top:16px;flex-wrap:wrap}}
.z-upi-icon{{
  height:32px;padding:0 10px;border-radius:8px;
  background:#fff;border:1px solid var(--z-g200);
  display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:700;color:var(--z-g500);
  transition:all .2s;cursor:default;
}}
.z-upi-icon:hover{{border-color:var(--z-g300);background:var(--z-g50)}}

/* ── Timer ── */
.z-timer{{
  display:inline-flex;align-items:center;gap:5px;margin-top:16px;
  padding:5px 14px;border-radius:20px;font-size:11px;font-weight:600;
  background:var(--z-g50);border:1px solid var(--z-g200);color:var(--z-g400);
}}
.z-timer svg{{width:12px;height:12px}}
.z-timer .z-tv{{color:var(--z-g700);font-variant-numeric:tabular-nums}}
.z-timer.urgent .z-tv{{color:var(--z-danger)}}

/* ── Card/NB/Wallet placeholder panels ── */
.z-alt-panel{{
  text-align:center;padding:40px 20px;
}}
.z-alt-icon{{
  width:56px;height:56px;border-radius:16px;margin:0 auto 16px;
  background:var(--z-g50);border:1px solid var(--z-g200);
  display:flex;align-items:center;justify-content:center;
}}
.z-alt-icon svg{{width:24px;height:24px;color:var(--z-g400)}}
.z-alt-title{{font-size:15px;font-weight:700;color:var(--z-g800);margin-bottom:4px}}
.z-alt-sub{{font-size:12px;color:var(--z-g400);line-height:1.5}}

/* ═══ PAY BUTTON ═════════════════════════════════ */
.z-pay-section{{padding:0 28px 20px}}
.z-or{{
  display:flex;align-items:center;gap:10px;margin-bottom:16px;
  font-size:10px;font-weight:700;color:var(--z-g300);text-transform:uppercase;letter-spacing:.12em;
}}
.z-or::before,.z-or::after{{content:'';flex:1;height:1px;background:var(--z-g200)}}
.z-btn{{
  display:flex;align-items:center;justify-content:center;gap:10px;width:100%;
  padding:16px 24px;border:none;border-radius:var(--z-r);font-size:15px;
  font-weight:700;font-family:inherit;cursor:pointer;text-decoration:none;
  background:var(--z-primary);color:#fff;
  transition:all .2s;position:relative;overflow:hidden;
}}
.z-btn::before{{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,transparent 0%,rgba(255,255,255,.1) 50%,transparent 100%);
  opacity:0;transition:opacity .3s;
}}
.z-btn:hover{{background:var(--z-primary-hover);transform:translateY(-1px);box-shadow:0 4px 16px rgba(26,86,219,.3)}}
.z-btn:hover::before{{opacity:1}}
.z-btn:active{{transform:translateY(0);box-shadow:none}}
.z-btn svg{{width:18px;height:18px}}
.z-btn-hint{{font-size:11px;color:var(--z-g400);text-align:center;margin-top:8px;font-weight:500}}

/* ═══ STATUS ═════════════════════════════════════ */
.z-status{{
  margin:0 28px 16px;padding:11px 16px;border-radius:var(--z-r);
  display:flex;align-items:center;gap:10px;font-size:12px;font-weight:600;
  transition:all .4s ease;
}}
.z-st-pend{{background:var(--z-warn-bg);color:#92400e;border:1px solid var(--z-warn-ring)}}
.z-st-ok{{background:var(--z-success-bg);color:#065f46;border:1px solid var(--z-success-ring)}}
.z-st-fail{{background:var(--z-danger-bg);color:#991b1b;border:1px solid var(--z-danger-ring)}}
.z-st-exp{{background:var(--z-g100);color:var(--z-g500);border:1px solid var(--z-g200)}}
.z-dot{{width:6px;height:6px;border-radius:50%;flex-shrink:0}}
.z-st-pend .z-dot{{background:var(--z-warn);animation:zDot 2s ease-in-out infinite}}
.z-st-ok .z-dot{{background:var(--z-success)}}
.z-st-fail .z-dot{{background:var(--z-danger)}}
@keyframes zDot{{0%,100%{{opacity:1;transform:scale(1)}}50%{{opacity:.3;transform:scale(.5)}}}}

/* ═══ TEST CREDS ═════════════════════════════════ */
.z-test{{
  margin:0 28px 16px;border-radius:var(--z-r);overflow:hidden;
  border:1px solid var(--z-warn-ring);background:var(--z-warn-bg);
}}
.z-test-head{{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 14px;cursor:pointer;user-select:none;
}}
.z-test-hl{{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#92400e}}
.z-test-hl svg{{color:var(--z-warn)}}
.z-chev{{transition:transform .2s;color:var(--z-warn)}}
.z-test.open .z-chev{{transform:rotate(180deg)}}
.z-test-body{{display:none;padding:0 14px 12px}}
.z-test.open .z-test-body{{display:block;animation:panelIn .2s ease}}
.z-tg{{margin-bottom:8px}}.z-tg:last-child{{margin-bottom:0}}
.z-tg-title{{font-size:10px;font-weight:800;color:#92400e;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;display:flex;align-items:center;gap:4px}}
.z-tg-title svg{{color:var(--z-warn);width:12px;height:12px}}
.z-ti{{display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:11px}}
.z-ti span{{color:#92400e;font-weight:500}}
.z-ti code{{background:rgba(255,255,255,.7);padding:1px 8px;border-radius:4px;font-size:10px;font-weight:700;color:var(--z-g800);font-family:'Inter',monospace}}

/* ═══ FOOTER ═════════════════════════════════════ */
.z-foot{{
  padding:14px 28px;background:var(--z-g50);border-top:1px solid var(--z-g100);
  display:flex;align-items:center;justify-content:space-between;
}}
.z-foot-badges{{display:flex;align-items:center;gap:14px}}
.z-fbadge{{display:flex;align-items:center;gap:3px;font-size:10px;font-weight:600;color:var(--z-g400)}}
.z-fbadge svg{{width:11px;height:11px;color:var(--z-g300)}}
.z-foot-brand{{font-size:10px;font-weight:500;color:var(--z-g400)}}
.z-foot-brand b{{color:var(--z-g500);font-weight:700}}

/* ═══ OVERLAY ════════════════════════════════════ */
.z-ov{{
  display:none;position:fixed;inset:0;background:rgba(15,23,42,.6);
  z-index:200;align-items:center;justify-content:center;
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
}}
.z-ov.active{{display:flex}}
.z-ov-card{{
  background:#fff;border-radius:var(--z-r3);padding:48px 40px;text-align:center;
  max-width:400px;width:90%;box-shadow:0 24px 64px rgba(0,0,0,.2);
  animation:ovIn .4s cubic-bezier(.16,1,.3,1);
}}
@keyframes ovIn{{from{{opacity:0;transform:scale(.92) translateY(24px)}}to{{opacity:1;transform:none}}}}
.z-ov-icon{{
  width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  margin:0 auto 24px;
}}
.z-ov-icon.ok{{background:var(--z-success-bg);color:var(--z-success)}}
.z-ov-icon.fail{{background:var(--z-danger-bg);color:var(--z-danger)}}
.z-ov-icon svg{{width:40px;height:40px}}
.z-ov-title{{font-size:24px;font-weight:900;color:var(--z-g900);margin-bottom:8px;letter-spacing:-.02em}}
.z-ov-text{{font-size:14px;color:var(--z-g500);line-height:1.6}}

/* ═══ RESPONSIVE ════════════════════════════════ */
@media(max-width:540px){{
  body{{padding:0;align-items:flex-start}}
  .z-checkout{{max-width:100%;border-radius:0;min-height:100vh}}
  .z-head{{padding:24px 20px 20px}}
  .z-amount{{font-size:42px}}
  .z-panel{{padding:20px}}
  .z-qr-wrap{{flex-direction:column;align-items:center}}
  .z-qr-frame img{{width:160px;height:160px}}
  .z-qr-steps{{text-align:center}}
  .z-upi-row{{justify-content:center}}
  .z-pay-section,.z-status,.z-test{{margin-left:20px;margin-right:20px}}
  .z-foot{{padding:12px 20px}}
}}
</style>
</head>
<body>

{sandbox_banner}

<div class="z-checkout">

  <!-- ── Header ── -->
  <div class="z-head">
    <div class="z-head-top">
      <div class="z-brand">
        <div class="z-logo"><img src="data:image/png;base64,{ZIVON_LOGO_B64}" alt="Z"></div>
        <div class="z-brand-info">
          <div class="z-brand-name">ZivonPay</div>
          <div class="z-verified"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg> Verified Merchant</div>
        </div>
      </div>
      <div class="z-secure-chip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        Secure
      </div>
    </div>
    <div class="z-amount-block">
      <div class="z-amount-label">Amount Due</div>
      <div class="z-amount"><span class="z-cur">₹</span>{amt_formatted}<span class="z-dec">.{amt_dec:02d}</span></div>
      <div class="z-order-chip">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1"/></svg>
        {page_data.customer_name} · <code>{page_data.order_id}</code>
      </div>
    </div>
  </div>

  <!-- ── Payment Method Tabs ── -->
  <div class="z-tabs">
    <button class="z-tab active" onclick="switchTab(this,'panelUPI')">
      <svg class="z-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="18" rx="3"/><path d="M2 9h20"/><circle cx="7" cy="15" r="1.5" fill="currentColor" stroke="none"/></svg>
      UPI
    </button>
    <button class="z-tab" onclick="switchTab(this,'panelCard')">
      <svg class="z-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 10h20"/><path d="M6 16h4"/></svg>
      Card
    </button>
    <button class="z-tab" onclick="switchTab(this,'panelNB')">
      <svg class="z-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>
      Netbanking
    </button>
    <button class="z-tab" onclick="switchTab(this,'panelWallet')">
      <svg class="z-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5z"/><path d="M16 12a1 1 0 102 0 1 1 0 00-2 0z" fill="currentColor" stroke="none"/></svg>
      Wallets
    </button>
  </div>

  <!-- ── UPI Panel ── -->
  <div class="z-panel active" id="panelUPI">
    <div class="z-qr-wrap">
      <div class="z-qr-frame">
        <div class="z-qr-corner tl"></div><div class="z-qr-corner tr"></div>
        <div class="z-qr-corner bl"></div><div class="z-qr-corner br"></div>
        <img src="{qr_url}" alt="QR" id="qrImg" onerror="this.style.display='none';this.parentElement.insertAdjacentHTML('beforeend','<div style=\\'width:140px;height:140px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:11px;font-weight:600\\'>QR unavailable</div>')">
      </div>
      <div class="z-qr-steps">
        <div class="z-step"><div class="z-step-n">1</div><p>Open any UPI app</p></div>
        <div class="z-step"><div class="z-step-n">2</div><p>Scan the QR code</p></div>
        <div class="z-step"><div class="z-step-n">3</div><p>Confirm &amp; pay</p></div>
        <div class="z-upi-row">
          <div class="z-upi-icon">GPay</div>
          <div class="z-upi-icon">PhonePe</div>
          <div class="z-upi-icon">Paytm</div>
          <div class="z-upi-icon">BHIM</div>
          <div class="z-upi-icon">+5</div>
        </div>
        <div class="z-timer" id="timerPill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="z-tv" id="timerValue">--:--</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Card Panel ── -->
  <div class="z-panel" id="panelCard">
    <div class="z-alt-panel">
      <div class="z-alt-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 10h20"/><path d="M6 16h4"/></svg></div>
      <div class="z-alt-title">Card Payments</div>
      <div class="z-alt-sub">Debit &amp; credit card payments<br>coming soon to this checkout</div>
    </div>
  </div>

  <!-- ── Netbanking Panel ── -->
  <div class="z-panel" id="panelNB">
    <div class="z-alt-panel">
      <div class="z-alt-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg></div>
      <div class="z-alt-title">Netbanking</div>
      <div class="z-alt-sub">Direct bank payments<br>coming soon to this checkout</div>
    </div>
  </div>

  <!-- ── Wallet Panel ── -->
  <div class="z-panel" id="panelWallet">
    <div class="z-alt-panel">
      <div class="z-alt-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5z"/><circle cx="17" cy="12" r="1" fill="currentColor" stroke="none"/></svg></div>
      <div class="z-alt-title">Wallets</div>
      <div class="z-alt-sub">Wallet payments<br>coming soon to this checkout</div>
    </div>
  </div>

  <!-- ── Pay Button ── -->
  <div class="z-pay-section">
    <div class="z-or">or pay via UPI app</div>
    <a class="z-btn" href="{upi_url}" id="payBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
      Pay ₹{amount_rupees:,.2f}
    </a>
    <div class="z-btn-hint">Opens your default UPI app</div>
  </div>

  <!-- ── Status ── -->
  <div id="statusBar" class="z-status z-st-pend">
    <span class="z-dot"></span>
    <span id="statusText">Waiting for payment…</span>
  </div>

  <!-- ── Test Credentials ── -->
  {sandbox_test_section}

  <!-- ── Footer ── -->
  <div class="z-foot">
    <div class="z-foot-badges">
      <div class="z-fbadge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> 256-bit</div>
      <div class="z-fbadge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> PCI DSS</div>
      <div class="z-fbadge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> RBI</div>
    </div>
    <div class="z-foot-brand">Secured by <b>ZivonPay</b></div>
  </div>
</div>

<!-- ── Overlay ── -->
<div class="z-ov" id="overlay">
  <div class="z-ov-card">
    <div class="z-ov-icon" id="ovIcon"><svg id="ovSvg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></svg></div>
    <div class="z-ov-title" id="ovTitle"></div>
    <div class="z-ov-text" id="ovText"></div>
  </div>
</div>

<script>
function switchTab(el,panelId){{
  document.querySelectorAll('.z-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.z-panel').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}}

(function(){{
  const STATUS_URL="{status_url}";
  const EXPIRES_AT=new Date("{page_data.expires_at}");
  const bar=document.getElementById('statusBar');
  const stxt=document.getElementById('statusText');
  const tv=document.getElementById('timerValue');
  const tp=document.getElementById('timerPill');
  const ov=document.getElementById('overlay');
  const ovIcon=document.getElementById('ovIcon');
  const ovSvg=document.getElementById('ovSvg');
  const ovTitle=document.getElementById('ovTitle');
  const ovText=document.getElementById('ovText');

  function updateTimer(){{
    const diff=EXPIRES_AT-new Date();
    if(diff<=0){{tv.textContent='00:00';tp.classList.add('urgent');return;}}
    const m=Math.floor(diff/60000),s=Math.floor((diff%60000)/1000);
    tv.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
    if(diff<120000)tp.classList.add('urgent');
  }}
  updateTimer();const ti=setInterval(updateTimer,1000);

  function showOv(type,title,text){{
    ovIcon.className='z-ov-icon '+type;
    ovSvg.innerHTML=type==='ok'
      ?'<polyline points="20 6 9 17 4 12"/>'
      :'<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    ovTitle.textContent=title;ovText.textContent=text;
    ov.classList.add('active');
  }}

  const poll=setInterval(async()=>{{
    try{{
      const r=await fetch(STATUS_URL);const d=await r.json();
      if(d.status==='success'){{
        bar.className='z-status z-st-ok';stxt.textContent='Payment received!';
        clearInterval(poll);clearInterval(ti);
        document.getElementById('payBtn').style.display='none';
        tp.style.display='none';
        setTimeout(()=>showOv('ok','Payment Successful','Your payment of ₹{amount_rupees:,.2f} has been received. You may close this page.'),600);
      }}else if(d.status==='failed'){{
        bar.className='z-status z-st-fail';stxt.textContent='Payment failed.';
        clearInterval(poll);clearInterval(ti);
        setTimeout(()=>showOv('fail','Payment Failed','Something went wrong. Please try again or contact the merchant.'),600);
      }}else if(d.status==='expired'){{
        bar.className='z-status z-st-exp';stxt.textContent='Payment link expired.';
        clearInterval(poll);clearInterval(ti);
        document.getElementById('payBtn').style.display='none';tp.style.display='none';
      }}
    }}catch(e){{}}
  }},3000);
}})();
</script>
</body>
</html>"""


def _expired_page(short_id: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link Expired — ZivonPay</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>*{{margin:0;padding:0;box-sizing:border-box}}body{{font-family:'Inter',system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f4f8;padding:16px}}
.card{{background:#fff;border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,.1);max-width:420px;width:100%;padding:48px 40px;text-align:center;position:relative;overflow:hidden}}
.card::before{{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#dc2626,#ef4444)}}
.icon{{width:72px;height:72px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}}
.icon svg{{width:36px;height:36px;color:#dc2626}}
h2{{font-size:22px;font-weight:800;color:#0f172a;margin-bottom:8px}}
p{{color:#64748b;font-size:14px;line-height:1.7}}strong{{color:#334155}}
.tag{{display:inline-block;margin-top:16px;padding:6px 14px;background:#f1f5f9;border-radius:8px;font-size:12px;font-weight:600;color:#64748b;font-family:monospace}}
</style></head><body>
<div class="card">
  <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
  <h2>Payment Link Expired</h2>
  <p>This payment link has expired. Please request a new payment link from the merchant.</p>
  <div class="tag">{short_id}</div>
</div></body></html>"""


def _success_page(short_id: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Payment Successful — ZivonPay</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>*{{margin:0;padding:0;box-sizing:border-box}}body{{font-family:'Inter',system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f4f8;padding:16px}}
.card{{background:#fff;border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,.1);max-width:420px;width:100%;padding:48px 40px;text-align:center;position:relative;overflow:hidden}}
.card::before{{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#059669,#10b981)}}
.icon{{width:72px;height:72px;border-radius:50%;background:#ecfdf5;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;animation:scaleIn .5s cubic-bezier(.16,1,.3,1)}}
@keyframes scaleIn{{from{{transform:scale(0)}}to{{transform:scale(1)}}}}
.icon svg{{width:36px;height:36px;color:#059669}}
h2{{font-size:22px;font-weight:800;color:#0f172a;margin-bottom:8px}}
p{{color:#64748b;font-size:14px;line-height:1.7}}strong{{color:#334155}}
.tag{{display:inline-block;margin-top:16px;padding:6px 14px;background:#ecfdf5;border-radius:8px;font-size:12px;font-weight:600;color:#059669;font-family:monospace}}
</style></head><body>
<div class="card">
  <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
  <h2>Payment Successful</h2>
  <p>Your payment has been received successfully. You may close this page.</p>
  <div class="tag">{short_id}</div>
</div></body></html>"""


def _error_page(short_id: str, error: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Error — ZivonPay</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>*{{margin:0;padding:0;box-sizing:border-box}}body{{font-family:'Inter',system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f4f8;padding:16px}}
.card{{background:#fff;border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,.1);max-width:420px;width:100%;padding:48px 40px;text-align:center;position:relative;overflow:hidden}}
.card::before{{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#dc2626,#ef4444)}}
.icon{{width:72px;height:72px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}}
.icon svg{{width:36px;height:36px;color:#dc2626}}
h2{{font-size:22px;font-weight:800;color:#0f172a;margin-bottom:8px}}
p{{color:#64748b;font-size:14px;line-height:1.7}}strong{{color:#334155}}
.retry{{display:inline-flex;align-items:center;gap:6px;margin-top:20px;padding:10px 24px;background:#2563eb;color:#fff;border-radius:10px;font-size:13px;font-weight:600;text-decoration:none;transition:background .2s}}
.retry:hover{{background:#1d4ed8}}
</style></head><body>
<div class="card">
  <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
  <h2>Payment Error</h2>
  <p>We couldn't initiate your payment for <strong>{short_id}</strong>. Please try again or contact the merchant.</p>
  <a class="retry" href="javascript:location.reload()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Try Again</a>
</div></body></html>"""
