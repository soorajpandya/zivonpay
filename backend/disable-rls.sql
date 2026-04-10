-- Enable Row Level Security on all ZivonPay tables
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/cieojfzmsqfwmcwsyxvv/sql

-- Enable RLS on all tables
ALTER TABLE IF EXISTS merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS api_keys ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('merchants', 'orders', 'payments', 'webhooks', 'idempotency_keys', 'rate_limits', 'audit_logs', 'api_keys');
