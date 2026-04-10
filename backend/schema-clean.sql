-- ZivonPay Database Schema - Clean Deployment
-- PostgreSQL 16+
-- This script safely drops and recreates all objects

-- =============================================
-- CLEANUP: Drop existing objects
-- =============================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS daily_transaction_metrics CASCADE;
DROP VIEW IF EXISTS merchant_transaction_summary CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_expired_idempotency_keys();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;
DROP TABLE IF EXISTS idempotency_keys CASCADE;
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS merchants CASCADE;

-- Drop types
DROP TYPE IF EXISTS webhook_status_type CASCADE;
DROP TYPE IF EXISTS webhook_event_type CASCADE;
DROP TYPE IF EXISTS payment_status_type CASCADE;
DROP TYPE IF EXISTS order_status_type CASCADE;
DROP TYPE IF EXISTS environment_type CASCADE;

-- =============================================
-- CREATE: Fresh schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE environment_type AS ENUM ('sandbox', 'production');
CREATE TYPE order_status_type AS ENUM ('created', 'qr_generated', 'paid', 'failed', 'expired', 'refunded');
CREATE TYPE payment_status_type AS ENUM ('created', 'authorized', 'captured', 'failed', 'refunded');
CREATE TYPE webhook_event_type AS ENUM ('payment.captured', 'payment.failed', 'order.paid', 'payment.refunded');
CREATE TYPE webhook_status_type AS ENUM ('pending', 'delivered', 'failed');

-- =============================================
-- Table: merchants
-- Stores merchant account information
-- =============================================
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15),
    
    -- API Credentials
    api_key_id VARCHAR(100) UNIQUE NOT NULL, -- zp_test_xxx or zp_live_xxx
    api_secret_hash VARCHAR(255) NOT NULL, -- bcrypt hashed
    webhook_url TEXT,
    webhook_secret_hash VARCHAR(255), -- bcrypt hashed for signature generation
    
    -- Environment
    environment environment_type NOT NULL DEFAULT 'sandbox',
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    
    -- Additional Data
    extra_data JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_merchants_api_key ON merchants(api_key_id);
CREATE INDEX idx_merchants_email ON merchants(email);
CREATE INDEX idx_merchants_environment ON merchants(environment);
CREATE INDEX idx_merchants_active ON merchants(is_active) WHERE is_active = true;

-- =============================================
-- Table: orders
-- Stores order information
-- =============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    
    -- Order Details
    receipt VARCHAR(255) NOT NULL, -- Merchant's order reference
    amount INTEGER NOT NULL, -- Amount in smallest currency unit (paise)
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status order_status_type NOT NULL DEFAULT 'created',
    
    -- Customer Information (Encrypted)
    customer_name TEXT, -- Encrypted with AES-256
    customer_mobile TEXT, -- Encrypted with AES-256
    customer_email TEXT, -- Encrypted with AES-256
    
    -- UPI Details
    upi_intent_url TEXT,
    qr_code_url TEXT,
    
    -- SprintNXT References
    upstream_reference VARCHAR(255), -- UPIRefID from SprintNXT
    upstream_merchant_id VARCHAR(255), -- merchantId from SprintNXT
    
    -- Additional Data
    notes JSONB DEFAULT '{}',
    extra_data JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT unique_merchant_receipt UNIQUE(merchant_id, receipt)
);

CREATE INDEX idx_orders_merchant ON orders(merchant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_receipt ON orders(merchant_id, receipt);
CREATE INDEX idx_orders_upstream_ref ON orders(upstream_reference);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_paid_at ON orders(paid_at DESC) WHERE paid_at IS NOT NULL;

-- =============================================
-- Table: payments
-- Stores payment transaction information
-- =============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    
    -- Payment Details
    amount INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status payment_status_type NOT NULL DEFAULT 'created',
    
    -- UPI Transaction Details
    payer_vpa TEXT, -- Encrypted VPA
    rrn VARCHAR(50), -- Retrieval Reference Number
    transaction_id VARCHAR(100), -- Bank transaction ID
    
    -- Bank Details
    bank_reference VARCHAR(100),
    bank_name VARCHAR(100),
    
    -- Failure Information
    error_code VARCHAR(50),
    error_description TEXT,
    
    -- Additional Data
    extra_data JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    captured_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT positive_payment_amount CHECK (amount > 0)
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_merchant ON payments(merchant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_rrn ON payments(rrn);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- =============================================
-- Table: webhooks
-- Stores webhook delivery attempts
-- =============================================
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    
    -- Event Details
    event_type webhook_event_type NOT NULL,
    entity_id UUID NOT NULL, -- ID of order or payment
    
    -- Delivery Details
    url TEXT NOT NULL,
    status webhook_status_type NOT NULL DEFAULT 'pending',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    
    -- Request/Response
    payload JSONB NOT NULL,
    response_status_code INTEGER,
    response_body TEXT,
    
    -- Signature
    signature VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    next_retry_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_webhooks_merchant ON webhooks(merchant_id);
CREATE INDEX idx_webhooks_status ON webhooks(status);
CREATE INDEX idx_webhooks_event_type ON webhooks(event_type);
CREATE INDEX idx_webhooks_next_retry ON webhooks(next_retry_at) WHERE status = 'pending';
CREATE INDEX idx_webhooks_created_at ON webhooks(created_at DESC);

-- =============================================
-- Table: idempotency_keys
-- Ensures idempotent API requests
-- =============================================
CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    
    -- Key Details
    idempotency_key VARCHAR(255) NOT NULL,
    request_path VARCHAR(500) NOT NULL,
    request_method VARCHAR(10) NOT NULL,
    
    -- Request/Response Data
    request_hash VARCHAR(64) NOT NULL, -- SHA256 hash of request body
    response_code INTEGER NOT NULL,
    response_body JSONB NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_idempotency_key UNIQUE(merchant_id, idempotency_key)
);

CREATE INDEX idx_idempotency_merchant_key ON idempotency_keys(merchant_id, idempotency_key);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

-- =============================================
-- Table: rate_limits
-- Tracks API rate limiting (Redis backup)
-- =============================================
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    
    -- Rate Limit Details
    endpoint VARCHAR(255) NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    limit_exceeded BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_merchant_endpoint_window UNIQUE(merchant_id, endpoint, window_start)
);

CREATE INDEX idx_rate_limits_merchant ON rate_limits(merchant_id);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

-- =============================================
-- Table: audit_logs
-- Comprehensive audit trail
-- =============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor Information
    merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
    user_id UUID, -- For future admin/staff users
    ip_address INET,
    user_agent TEXT,
    
    -- Action Details
    action VARCHAR(100) NOT NULL, -- e.g., 'order.create', 'payment.capture'
    entity_type VARCHAR(50), -- e.g., 'order', 'payment'
    entity_id UUID,
    
    -- Request Details
    request_id VARCHAR(100),
    endpoint VARCHAR(500),
    http_method VARCHAR(10),
    
    -- Data
    changes JSONB, -- Before/after changes
    extra_data JSONB DEFAULT '{}',
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_merchant ON audit_logs(merchant_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_request_id ON audit_logs(request_id);

-- =============================================
-- Table: api_keys (For multiple keys per merchant)
-- =============================================
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    
    -- Key Details
    key_id VARCHAR(100) UNIQUE NOT NULL,
    key_secret_hash VARCHAR(255) NOT NULL,
    key_name VARCHAR(100),
    
    -- Permissions
    is_active BOOLEAN NOT NULL DEFAULT true,
    environment environment_type NOT NULL DEFAULT 'sandbox',
    
    -- Metadata
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_merchant ON api_keys(merchant_id);
CREATE INDEX idx_api_keys_key_id ON api_keys(key_id);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

-- =============================================
-- Functions and Triggers
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-expire idempotency keys (cleanup function)
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS void AS $$
BEGIN
    DELETE FROM idempotency_keys WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Views for Analytics
-- =============================================

-- Merchant transaction summary
CREATE VIEW merchant_transaction_summary AS
SELECT 
    m.id as merchant_id,
    m.business_name,
    m.environment,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'paid' THEN o.id END) as paid_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'failed' THEN o.id END) as failed_orders,
    COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.amount END), 0) as total_amount_paid,
    COALESCE(AVG(CASE WHEN o.status = 'paid' THEN o.amount END), 0) as avg_order_value
FROM merchants m
LEFT JOIN orders o ON m.id = o.merchant_id
GROUP BY m.id, m.business_name, m.environment;

-- Daily transaction metrics
CREATE VIEW daily_transaction_metrics AS
SELECT 
    DATE(o.created_at) as transaction_date,
    o.merchant_id,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN o.status = 'paid' THEN 1 END) as successful_orders,
    SUM(o.amount) as total_volume,
    SUM(CASE WHEN o.status = 'paid' THEN o.amount ELSE 0 END) as successful_volume
FROM orders o
GROUP BY DATE(o.created_at), o.merchant_id;

-- Comments for documentation
COMMENT ON TABLE merchants IS 'Stores merchant account information and API credentials';
COMMENT ON TABLE orders IS 'Stores order information with encrypted customer data';
COMMENT ON TABLE payments IS 'Stores payment transaction details';
COMMENT ON TABLE webhooks IS 'Tracks webhook delivery attempts and status';
COMMENT ON TABLE idempotency_keys IS 'Ensures idempotent API requests';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance';

-- End of schema
