-- Migration: Add live API key columns to merchants table
-- This allows merchants to have both sandbox (key_test_*) and live (key_live_*) credentials

ALTER TABLE merchants
    ADD COLUMN IF NOT EXISTS live_api_key_id VARCHAR(100) UNIQUE,
    ADD COLUMN IF NOT EXISTS live_api_secret_hash VARCHAR(255);

-- Create index for live key lookups
CREATE INDEX IF NOT EXISTS ix_merchants_live_api_key_id
    ON merchants (live_api_key_id)
    WHERE live_api_key_id IS NOT NULL;
