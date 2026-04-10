-- =============================================
-- Migration: Add payment_intents table
-- Run this against your database to add the
-- Payment Intent Link feature.
-- =============================================

-- Custom type for payment intent status
DO $$ BEGIN
    CREATE TYPE payment_intent_status_type AS ENUM (
        'created', 'pending', 'success', 'failed', 'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


CREATE TABLE IF NOT EXISTS payment_intents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Merchant ownership
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

    -- URL-friendly identifier  (pi_<hex>)
    short_id VARCHAR(32) UNIQUE NOT NULL,

    -- Intent details
    amount INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    order_id VARCHAR(255) NOT NULL,
    status payment_intent_status_type NOT NULL DEFAULT 'created',

    -- Customer information (encrypted at rest)
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,

    -- Signed JWT for the payment link
    link_token TEXT NOT NULL,

    -- SprintNXT upstream references
    upstream_reference VARCHAR(255),
    upstream_merchant_id VARCHAR(255),
    upi_intent_url TEXT,

    -- Payment result
    payer_vpa TEXT,
    rrn VARCHAR(50),
    bank_name VARCHAR(100),
    error_code VARCHAR(50),
    error_description TEXT,

    -- Metadata
    notes JSONB DEFAULT '{}',
    extra_data JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT positive_pi_amount CHECK (amount > 0),
    CONSTRAINT unique_merchant_order_id UNIQUE (merchant_id, order_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pi_merchant     ON payment_intents(merchant_id);
CREATE INDEX IF NOT EXISTS idx_pi_short_id     ON payment_intents(short_id);
CREATE INDEX IF NOT EXISTS idx_pi_status       ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_pi_created_at   ON payment_intents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pi_expires_at   ON payment_intents(expires_at);
CREATE INDEX IF NOT EXISTS idx_pi_upstream_ref ON payment_intents(upstream_reference);
CREATE INDEX IF NOT EXISTS idx_pi_order_id     ON payment_intents(merchant_id, order_id);

-- Comments
COMMENT ON TABLE  payment_intents IS 'Standalone payment intent / link flow (independent of QR orders)';
COMMENT ON COLUMN payment_intents.amount IS 'Amount in smallest currency unit (paise)';
COMMENT ON COLUMN payment_intents.short_id IS 'URL-friendly identifier used in payment links';
COMMENT ON COLUMN payment_intents.link_token IS 'Signed JWT embedded in the payment URL';
