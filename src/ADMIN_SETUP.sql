-- ============================================
-- GOPASS ADMIN ACCOUNT SETUP
-- ============================================
-- Run this in Supabase SQL Editor to create your admin account
-- 
-- IMPORTANT: Change the password before running!
-- ============================================

INSERT INTO kv_store_0f8d8d4a (key, value)
VALUES (
  'admin:credentials',
  '{"id":"admin-1","email":"admin@gopass.com","password":"YourSecurePassword123!"}'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- ============================================
-- WHAT THIS DOES:
-- ============================================
-- Creates an admin account with:
--   Email: admin@gopass.com
--   Password: YourSecurePassword123! (CHANGE THIS!)
--
-- The "ON CONFLICT" part means if you run this again,
-- it will update the existing admin account instead of erroring.
-- ============================================

-- ============================================
-- AFTER RUNNING THIS:
-- ============================================
-- 1. Go to your GoPass app homepage
-- 2. Scroll to bottom and click "Admin Access"
-- 3. Login with:
--    Email: admin@gopass.com
--    Password: (whatever you set above)
-- ============================================

-- ============================================
-- TO CHANGE PASSWORD LATER:
-- ============================================
-- Just update the password in the SQL above and run it again!
-- ============================================
