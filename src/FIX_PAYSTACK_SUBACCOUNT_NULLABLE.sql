-- Make paystack_subaccount_id nullable since it comes from Make.com asynchronously
-- The subaccount ID may not be available immediately when the organizer first saves their bank details

ALTER TABLE organizers 
  ALTER COLUMN paystack_subaccount_id DROP NOT NULL;

-- Optional: Add a default value of empty string instead of null
-- Uncomment if you prefer empty string over null:
-- ALTER TABLE organizers 
--   ALTER COLUMN paystack_subaccount_id SET DEFAULT '';
