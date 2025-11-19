-- Add user_id column to organizers table
-- This links the organizer record to the authenticated user

ALTER TABLE organizers 
  ADD COLUMN IF NOT EXISTS user_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizers_user_id ON organizers(user_id);

-- Optional: Clean up the typo column (remove the comment to execute)
-- ALTER TABLE organizers DROP COLUMN IF EXISTS "paystack_subaccount - id";
