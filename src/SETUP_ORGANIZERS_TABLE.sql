-- Add missing columns to organizers table for bank details and Paystack integration
-- Run this SQL in your Supabase SQL Editor

-- If the organizers table doesn't exist yet, create it:
CREATE TABLE IF NOT EXISTS organizers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  bank_name TEXT,
  bank_code TEXT,
  account_number TEXT,
  account_name TEXT,
  paystack_subaccount_id TEXT,
  subaccount_setup_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table already exists, add the missing columns:
ALTER TABLE organizers 
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_code TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT,
  ADD COLUMN IF NOT EXISTS paystack_subaccount_id TEXT,
  ADD COLUMN IF NOT EXISTS subaccount_setup_complete BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizers_user_id ON organizers(user_id);
CREATE INDEX IF NOT EXISTS idx_organizers_email ON organizers(email);

-- Enable Row Level Security (RLS)
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own organizer data
CREATE POLICY IF NOT EXISTS "Users can view their own organizer data"
  ON organizers FOR SELECT
  USING (auth.uid()::text = user_id);

-- Create policy to allow users to insert their own organizer data
CREATE POLICY IF NOT EXISTS "Users can insert their own organizer data"
  ON organizers FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Create policy to allow users to update their own organizer data
CREATE POLICY IF NOT EXISTS "Users can update their own organizer data"
  ON organizers FOR UPDATE
  USING (auth.uid()::text = user_id);
