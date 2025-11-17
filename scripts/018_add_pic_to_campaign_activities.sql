-- Add PIC column to campaign_activities table
-- Run this script in Supabase SQL Editor

-- Add column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaign_activities' 
    AND column_name = 'pic'
  ) THEN
    ALTER TABLE public.campaign_activities 
    ADD COLUMN pic TEXT;
  END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'campaign_activities'
AND column_name = 'pic';

