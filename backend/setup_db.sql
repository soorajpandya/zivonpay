-- Create ZivonPay Database and User
-- Run this with: psql -U postgres -f setup_db.sql

-- Create user (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'zivonpay') THEN
        CREATE USER zivonpay WITH PASSWORD 'password';
    END IF;
END
$$;

-- Create database
DROP DATABASE IF EXISTS zivonpay_sandbox;
CREATE DATABASE zivonpay_sandbox OWNER zivonpay;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE zivonpay_sandbox TO zivonpay;

\c zivonpay_sandbox

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO zivonpay;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO zivonpay;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO zivonpay;

\echo 'Database setup complete!'
\echo 'User: zivonpay'
\echo 'Database: zivonpay_sandbox'
\echo ''
\echo 'Now run: psql -U zivonpay -d zivonpay_sandbox -f schema.sql'
