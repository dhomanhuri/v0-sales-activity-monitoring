-- Update campaign_activities table to support new activity types
-- Run this script to update the CHECK constraint for jenis_aktivitas

-- Drop the old constraint
ALTER TABLE public.campaign_activities 
  DROP CONSTRAINT IF EXISTS campaign_activities_jenis_aktivitas_check;

-- Add new constraint with updated activity types
ALTER TABLE public.campaign_activities 
  ADD CONSTRAINT campaign_activities_jenis_aktivitas_check 
  CHECK (jenis_aktivitas IN ('Chat customer', 'Presentation', 'Demo', 'POC', 'Tender', 'Closing'));

-- Verify the constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.campaign_activities'::regclass
AND conname = 'campaign_activities_jenis_aktivitas_check';

