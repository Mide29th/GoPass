-- Drop the duplicate column with dash that has NOT NULL constraint
-- The code uses "paystack_subaccount_id" (underscore) which is already nullable
-- This column "paystack_subaccount-id" (dash) is causing the error

ALTER TABLE organizers 
  DROP COLUMN "paystack_subaccount-id";
