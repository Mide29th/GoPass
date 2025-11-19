-- Fix RLS policy for organizers table
-- This allows authenticated users to insert and update their own organizer records

-- Enable RLS if not already enabled
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own organizer record" ON organizers;
DROP POLICY IF EXISTS "Users can view their own organizer record" ON organizers;
DROP POLICY IF EXISTS "Users can update their own organizer record" ON organizers;

-- Allow users to insert their own organizer record
CREATE POLICY "Users can insert their own organizer record"
ON organizers
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Allow users to view their own organizer record
CREATE POLICY "Users can view their own organizer record"
ON organizers
FOR SELECT
USING (auth.uid()::text = user_id);

-- Allow users to update their own organizer record
CREATE POLICY "Users can update their own organizer record"
ON organizers
FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);
