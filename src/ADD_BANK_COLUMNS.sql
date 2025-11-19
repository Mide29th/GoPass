-- Add missing bank details columns to existing organizers table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE organizers 
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_code TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT,
  ADD COLUMN IF NOT EXISTS paystack_subaccount_id TEXT,
  ADD COLUMN IF NOT EXISTS subaccount_setup_complete BOOLEAN DEFAULT false;
