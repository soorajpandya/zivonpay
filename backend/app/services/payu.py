"""
PayU Hash Generation Service

Implements PayU's SHA-512 hashing logic for:
  1. Payment requests (forward hash)
  2. Payment responses (reverse hash validation)
  3. General command-based postservice APIs

Reference: https://docs.payu.in/docs/generate-hash

Security notes:
  - The Salt is sensitive. Never send it in a payment request or expose it
    client-side. Hashes must be generated server-side only.
"""

import hashlib
import hmac
import html
import logging
from decimal import Decimal, InvalidOperation
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# PayU _payment endpoints.
PAYU_TEST_PAYMENT_URL = "https://test.payu.in/_payment"
PAYU_PROD_PAYMENT_URL = "https://secure.payu.in/_payment"

# UDF fields included in the payment-request hash, in order.
_UDF_FIELDS = ["udf1", "udf2", "udf3", "udf4", "udf5"]


def _sha512(raw: str) -> str:
    """Return the lowercase hex SHA-512 digest of a string (UTF-8 encoded)."""
    return hashlib.sha512(raw.encode("utf-8")).hexdigest()


def generate_payment_hash(
    params: Dict[str, str],
    salt: str,
) -> str:
    """
    Generate the hash for a PayU payment (_payment) request.

    Hash string format:
        key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT

    There are 15 pipe delimiters in total. Any UDF that is not supplied is
    treated as an empty string but its delimiter is still included.

    Args:
        params: Dict containing at least the required keys: key, txnid, amount,
            productinfo, firstname, email. May optionally include udf1..udf5.
        salt: Your PayU merchant salt (Test or Production).

    Returns:
        Lowercase hex SHA-512 hash.

    Raises:
        KeyError: If a required parameter is missing.
    """
    required = ["key", "txnid", "amount", "productinfo", "firstname", "email"]
    missing = [field for field in required if not params.get(field)]
    if missing:
        raise KeyError(f"Missing required PayU hash parameter(s): {', '.join(missing)}")

    ordered = [
        params["key"],
        params["txnid"],
        params["amount"],
        params["productinfo"],
        params["firstname"],
        params["email"],
    ]
    ordered.extend(params.get(udf, "") or "" for udf in _UDF_FIELDS)

    # ...udf5 followed by six pipe delimiters (reserved empty fields) then salt.
    hash_string = "|".join(ordered) + "||||||" + salt

    logger.debug("Generated PayU payment request hash for txnid=%s", params.get("txnid"))
    return _sha512(hash_string)


def generate_intent_hash(
    params: Dict[str, str],
    salt: str,
    si_details: str = "",
) -> str:
    """
    Generate the hash for a PayU Server-to-Server (S2S) UPI Intent request.

    This differs from the standard payment-request hash by including the
    ``si_details`` field before the salt (PayU S2S hash sequence, Case 1):

        key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||si_details|salt

    For a one-time (non-mandate) UPI intent, ``si_details`` is empty.

    Args:
        params: Dict with required keys: key, txnid, amount, productinfo,
            firstname, email. Optional udf1..udf5.
        salt: Your PayU merchant salt.
        si_details: Standing-instruction details JSON (empty for one-time intent).

    Returns:
        Lowercase hex SHA-512 hash.

    Raises:
        KeyError: If a required parameter is missing.
    """
    required = ["key", "txnid", "amount", "productinfo", "firstname", "email"]
    missing = [field for field in required if not params.get(field)]
    if missing:
        raise KeyError(f"Missing required PayU hash parameter(s): {', '.join(missing)}")

    ordered = [
        params["key"],
        params["txnid"],
        params["amount"],
        params["productinfo"],
        params["firstname"],
        params["email"],
    ]
    ordered.extend(params.get(udf, "") or "" for udf in _UDF_FIELDS)
    # 5 reserved empty fields (udf6..udf10) then si_details.
    ordered.extend(["", "", "", "", "", si_details])

    hash_string = "|".join(ordered) + "|" + salt
    return _sha512(hash_string)


def generate_split_payment_hash(
    params: Dict[str, str],
    salt: str,
    split_request: str,
) -> str:
    """
    Generate the hash for a PayU _payment request that carries a ``splitRequest``
    (Aggregator / Marketplace "Split During Transaction" flow).

    The ``splitRequest`` JSON string is appended to the end of the regular
    payment-request hash sequence:

        key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT|splitRequest

    The exact same ``split_request`` string MUST be posted as the form field so
    the hash matches.

    Args:
        params: Dict with required keys: key, txnid, amount, productinfo,
            firstname, email. Optional udf1..udf5.
        salt: Your PayU merchant (parent/aggregator) salt.
        split_request: The serialized splitRequest JSON string.

    Returns:
        Lowercase hex SHA-512 hash.
    """
    base = generate_payment_hash(params, salt)  # validates required params
    # Re-derive the hash string with the salt + splitRequest suffix.
    ordered = [
        params["key"],
        params["txnid"],
        params["amount"],
        params["productinfo"],
        params["firstname"],
        params["email"],
    ]
    ordered.extend(params.get(udf, "") or "" for udf in _UDF_FIELDS)
    hash_string = "|".join(ordered) + "||||||" + salt + "|" + split_request
    del base  # base computed only to validate required fields
    return _sha512(hash_string)


def generate_response_hash(
    params: Dict[str, str],
    salt: str,
    additional_charges: Optional[str] = None,
    split_info: Optional[str] = None,
) -> str:
    """
    Generate the expected reverse hash for a PayU payment response.

    Reverse order (regular integration):
        SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key

    Optional variations:
      - additional_charges: prepended -> additional_charges|SALT|status|...
      - split_info: inserted after status -> SALT|status|splitInfo|...
      - both: additional_charges|SALT|status|splitInfo|...

    Args:
        params: Response params containing key, txnid, amount, productinfo,
            firstname, email, status, and optional udf1..udf5.
        salt: Your PayU merchant salt.
        additional_charges: Value of the additional_charges field, if present.
        split_info: Split info string, if present.

    Returns:
        Lowercase hex SHA-512 hash to compare against the response 'hash'.
    """
    udf_reversed = [params.get(udf, "") or "" for udf in reversed(_UDF_FIELDS)]

    parts = [salt, params.get("status", "")]

    if split_info is not None:
        parts.append(split_info)

    # Six reserved empty fields between status/splitInfo and the udf block.
    parts.extend(["", "", "", "", "", ""])
    parts.extend(udf_reversed)
    parts.extend([
        params.get("email", ""),
        params.get("firstname", ""),
        params.get("productinfo", ""),
        params.get("amount", ""),
        params.get("txnid", ""),
        params.get("key", ""),
    ])

    hash_string = "|".join(parts)

    if additional_charges is not None:
        hash_string = f"{additional_charges}|{hash_string}"

    return _sha512(hash_string)


def verify_response_hash(
    params: Dict[str, str],
    salt: str,
    received_hash: str,
    additional_charges: Optional[str] = None,
    split_info: Optional[str] = None,
) -> bool:
    """
    Validate a PayU payment response hash.

    Recomputes the reverse hash and compares it (constant-time) against the
    hash returned by PayU. Always verify the response hash before marking a
    transaction successful.

    Args:
        params: Response params (see generate_response_hash).
        salt: Your PayU merchant salt.
        received_hash: The 'hash' value PayU sent in the response.
        additional_charges: Optional additional_charges field from response.
        split_info: Optional split info string from response.

    Returns:
        True if the hash matches, False otherwise.
    """
    if not received_hash:
        return False

    expected = generate_response_hash(
        params,
        salt,
        additional_charges=additional_charges,
        split_info=split_info,
    )
    return hmac.compare_digest(expected.lower(), received_hash.strip().lower())


def generate_command_hash(
    key: str,
    command: str,
    var1: str,
    salt: str,
) -> str:
    """
    Generate the hash for PayU general command-based postservice APIs.

    Used by APIs such as verify_payment, get_transaction_details,
    udf_update, check_action_status, etc.

    Hash string format:
        key|command|var1|salt

    Args:
        key: Your merchant key.
        command: The API command (e.g. "verify_payment").
        var1: The primary variable for the command (e.g. txnid or payuId).
        salt: Your PayU merchant salt.

    Returns:
        Lowercase hex SHA-512 hash.
    """
    hash_string = f"{key}|{command}|{var1}|{salt}"
    return _sha512(hash_string)


def payment_endpoint(environment: Optional[str] = None) -> str:
    """
    Return the correct _payment endpoint for the given PayU environment.

    Args:
        environment: "production" for the live endpoint, anything else
            (e.g. "test") for the test endpoint. Defaults to
            settings.PAYU_ENVIRONMENT.

    Returns:
        The PayU _payment URL.
    """
    if environment is None:
        from app.config import settings
        environment = settings.PAYU_ENVIRONMENT
    return PAYU_PROD_PAYMENT_URL if environment == "production" else PAYU_TEST_PAYMENT_URL


def normalize_amount(amount) -> str:
    """
    Normalize an amount into the decimal string PayU expects (e.g. "100.00").

    PayU rejects amounts with currency symbols, thousands separators, or
    non-positive values ("Invalid amount"). The returned string MUST be used
    both in the hash and the posted form field so they match exactly.

    Args:
        amount: A number or numeric string (e.g. 100, "100", "100.5").

    Returns:
        Amount formatted to two decimal places, e.g. "100.00".

    Raises:
        ValueError: If the amount is not a valid positive number.
    """
    try:
        value = Decimal(str(amount).strip())
    except (InvalidOperation, AttributeError):
        raise ValueError(f"Invalid amount: {amount!r}")

    if value <= 0:
        raise ValueError(f"Amount must be greater than zero: {amount!r}")

    return f"{value:.2f}"


def build_payment_request(
    *,
    key: str,
    salt: str,
    txnid: str,
    amount,
    productinfo: str,
    firstname: str,
    email: str,
    phone: str,
    surl: str,
    furl: str,
    udf1: str = "",
    udf2: str = "",
    udf3: str = "",
    udf4: str = "",
    udf5: str = "",
    extra: Optional[Dict[str, str]] = None,
    split_request: Optional[str] = None,
) -> Dict[str, str]:
    """
    Build a complete, validated PayU _payment request field set (with hash).

    Guarantees the hash is computed over the exact same values that are posted,
    avoiding the most common "hash mismatch" / "Invalid amount" errors. The
    salt is used only to compute the hash and is NOT included in the output.

    Args:
        key: Merchant key.
        salt: Merchant salt (used for hashing only, never posted).
        txnid: Unique transaction id.
        amount: Transaction amount (normalized to "0.00" format).
        productinfo: Product description.
        firstname: Customer first name.
        email: Customer email.
        phone: Customer phone.
        surl: Success callback URL.
        furl: Failure callback URL.
        udf1..udf5: Optional user-defined fields (included in the hash).
        extra: Optional additional form fields (NOT included in the hash).
        split_request: Optional serialized splitRequest JSON (Aggregator
            "Split During Transaction"). When set, it is included both in the
            hash (appended after the salt) and as a posted form field.

    Returns:
        Dict of form fields ready to POST to the _payment endpoint.

    Raises:
        ValueError: If the amount is invalid.
    """
    amount_str = normalize_amount(amount)

    hash_params = {
        "key": key,
        "txnid": txnid,
        "amount": amount_str,
        "productinfo": productinfo,
        "firstname": firstname,
        "email": email,
        "udf1": udf1,
        "udf2": udf2,
        "udf3": udf3,
        "udf4": udf4,
        "udf5": udf5,
    }

    if split_request:
        hash_value = generate_split_payment_hash(hash_params, salt, split_request)
    else:
        hash_value = generate_payment_hash(hash_params, salt)

    fields = {
        **hash_params,
        "phone": phone,
        "surl": surl,
        "furl": furl,
        "hash": hash_value,
    }

    if split_request:
        fields["splitRequest"] = split_request

    if extra:
        fields.update(extra)

    return fields


def build_payment_form_html(action_url: str, fields: Dict[str, str]) -> str:
    """
    Build a self-submitting HTML form that POSTs the fields to PayU.

    Useful for redirecting the customer's browser to the PayU checkout. All
    values are HTML-escaped to prevent breaking out of the attribute context.

    Args:
        action_url: The _payment endpoint (see payment_endpoint()).
        fields: Form fields from build_payment_request().

    Returns:
        A complete HTML document string.
    """
    inputs = "\n".join(
        f'    <input type="hidden" name="{html.escape(name)}" '
        f'value="{html.escape(str(value))}" />'
        for name, value in fields.items()
    )
    return (
        "<!DOCTYPE html>\n<html>\n<body onload=\"document.forms[0].submit()\">\n"
        f'  <form method="post" action="{html.escape(action_url)}">\n'
        f"{inputs}\n"
        "  </form>\n</body>\n</html>"
    )


def build_collect_payment(
    *,
    txnid: str,
    amount,
    productinfo: str,
    firstname: str,
    email: str,
    phone: str,
    surl: Optional[str] = None,
    furl: Optional[str] = None,
    udf1: str = "",
    udf2: str = "",
    udf3: str = "",
    udf4: str = "",
    udf5: str = "",
    extra: Optional[Dict[str, str]] = None,
    split_request: Optional[str] = None,
) -> Dict[str, object]:
    """
    Assemble a complete, signed PayU collect-payment request using credentials
    and environment from application settings.

    The merchant key/salt and the PayU endpoint are read from settings, so
    callers never handle the salt directly. The returned dict contains the
    action URL, the signed form fields, and a self-submitting HTML form.

    Args:
        txnid: Unique transaction id.
        amount: Transaction amount (normalized to "0.00").
        productinfo: Product description.
        firstname: Customer first name.
        email: Customer email.
        phone: Customer phone.
        surl: Success callback URL (defaults to settings.PAYU_SURL).
        furl: Failure callback URL (defaults to settings.PAYU_FURL).
        udf1..udf5: Optional user-defined fields (hashed).
        extra: Optional non-hashed passthrough fields (e.g. pg, bankcode, vpa,
            address1).

    Returns:
        Dict with keys: action_url (str), fields (dict), form_html (str).

    Raises:
        RuntimeError: If PayU credentials are not configured.
        ValueError: If the amount is invalid.
    """
    from app.config import settings

    if not settings.PAYU_MERCHANT_KEY or not settings.PAYU_SALT:
        raise RuntimeError("PayU credentials are not configured (PAYU_MERCHANT_KEY/PAYU_SALT)")

    fields = build_payment_request(
        key=settings.PAYU_MERCHANT_KEY,
        salt=settings.PAYU_SALT,
        txnid=txnid,
        amount=amount,
        productinfo=productinfo,
        firstname=firstname,
        email=email,
        phone=phone,
        surl=surl or settings.PAYU_SURL,
        furl=furl or settings.PAYU_FURL,
        udf1=udf1,
        udf2=udf2,
        udf3=udf3,
        udf4=udf4,
        udf5=udf5,
        extra=extra,
        split_request=split_request,
    )

    action_url = payment_endpoint(settings.PAYU_ENVIRONMENT)

    return {
        "action_url": action_url,
        "fields": fields,
        "form_html": build_payment_form_html(action_url, fields),
    }
