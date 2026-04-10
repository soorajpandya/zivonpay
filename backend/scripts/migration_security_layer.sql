-- ═══════════════════════════════════════════════════════════════
-- ZivonPay — Security Layer Migration
-- Creates: merchant_security_configs, security_audit_logs
-- ═══════════════════════════════════════════════════════════════

-- 1. Merchant Security Configuration (per-merchant whitelist & toggles)
CREATE TABLE IF NOT EXISTS merchant_security_configs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id     UUID NOT NULL UNIQUE REFERENCES merchants(id) ON DELETE CASCADE,

    -- Whitelisted domains (JSON array)
    whitelisted_domains     JSONB DEFAULT '[]'::jsonb,

    -- Whitelisted IPs (JSON array — supports CIDR)
    whitelisted_ips         JSONB DEFAULT '[]'::jsonb,

    -- Feature toggles
    enforce_domain_check        BOOLEAN NOT NULL DEFAULT false,
    enforce_ip_check            BOOLEAN NOT NULL DEFAULT false,
    enforce_request_signing     BOOLEAN NOT NULL DEFAULT false,
    enforce_replay_protection   BOOLEAN NOT NULL DEFAULT true,

    -- Signing secret (AES-256 encrypted, NOT hashed — server needs plaintext to recompute HMAC)
    signing_secret_hash     VARCHAR(255),

    -- Rate limit override (null = global default)
    rate_limit_per_minute   VARCHAR(20),

    -- Device fingerprinting
    enforce_device_binding          BOOLEAN NOT NULL DEFAULT false,
    known_device_fingerprints       JSONB DEFAULT '[]'::jsonb,

    -- mTLS
    mtls_certificate_subject    VARCHAR(500),
    enforce_mtls                BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_config_merchant ON merchant_security_configs(merchant_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_security_config_updated ON merchant_security_configs;
CREATE TRIGGER trg_security_config_updated
    BEFORE UPDATE ON merchant_security_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 2. Security Audit Log (hash-chained, append-only)
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence        SERIAL UNIQUE NOT NULL,

    -- Event classification
    event_type      VARCHAR(50) NOT NULL,
    severity        VARCHAR(10) NOT NULL DEFAULT 'medium',

    -- Actor / source
    api_key_id      VARCHAR(100),
    merchant_id     VARCHAR(100),
    client_ip       INET,
    origin          VARCHAR(500),
    user_agent      VARCHAR(1000),

    -- Request context
    http_method     VARCHAR(10),
    endpoint        VARCHAR(500),
    request_id      VARCHAR(100),

    -- Failure details
    failure_reason  TEXT,
    failure_layer   VARCHAR(50),

    -- Device fingerprint
    device_fingerprint  VARCHAR(128),

    -- Extra metadata
    extra_data      JSONB DEFAULT '{}'::jsonb,

    -- Hash chain
    previous_hash   VARCHAR(64),
    record_hash     VARCHAR(64) NOT NULL UNIQUE,

    -- Timestamp
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_sec_audit_event     ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sec_audit_severity  ON security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_sec_audit_apikey    ON security_audit_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_sec_audit_merchant  ON security_audit_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_sec_audit_ip        ON security_audit_logs(client_ip);
CREATE INDEX IF NOT EXISTS idx_sec_audit_reqid     ON security_audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_sec_audit_created   ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sec_audit_hash      ON security_audit_logs(record_hash);
CREATE INDEX IF NOT EXISTS idx_sec_audit_layer     ON security_audit_logs(failure_layer);

-- Revoke DELETE/UPDATE on audit logs (append-only protection)
-- Uncomment in production after initial testing:
-- REVOKE DELETE, UPDATE ON security_audit_logs FROM api_user;

-- ═══════════════════════════════════════════════════════════════
-- Done. Tables are ready.
-- ═══════════════════════════════════════════════════════════════
