-- Drop the typo column "paystack_subaccount - id" (with space and dash)
-- This column has NOT NULL constraint and is causing errors
-- We only need the correct column "paystack_subaccount_id"

ALTER TABLE organizers 
  DROP COLUMN IF EXISTS "paystack_subaccount - id";
