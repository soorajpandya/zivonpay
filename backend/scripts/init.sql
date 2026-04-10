-- ZivonPay Database Initialization Script
-- This script creates the database and initial setup

-- Connect to default postgres database
\c postgres

-- Drop and recreate databases (if needed)
DROP DATABASE IF EXISTS zivonpay_sandbox;
DROP DATABASE IF EXISTS zivonpay_production;

-- Create databases
CREATE DATABASE zivonpay_sandbox
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

CREATE DATABASE zivonpay_production
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Create user (if not exists)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'zivonpay'
   ) THEN
      CREATE USER zivonpay WITH PASSWORD 'password';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE zivonpay_sandbox TO zivonpay;
GRANT ALL PRIVILEGES ON DATABASE zivonpay_production TO zivonpay;

-- Connect to sandbox database and create extensions
\c zivonpay_sandbox
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Connect to production database and create extensions
\c zivonpay_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\echo 'Database initialization complete!'
