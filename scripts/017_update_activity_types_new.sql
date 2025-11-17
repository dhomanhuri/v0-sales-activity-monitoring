-- Update activity types to new list: Initiate Call, Presentation, Demo, POC, Tender, Negotiation, Closing
-- Run this script in Supabase SQL Editor

-- Step 1: Drop the old constraint
DO $$
BEGIN
  -- Find and drop the existing constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_schema = 'public' 
    AND table_name = 'campaign_activities' 
    AND constraint_name LIKE '%jenis_aktivitas%'
  ) THEN
    -- Get the constraint name
    DECLARE
      constraint_name_var TEXT;
    BEGIN
      SELECT constraint_name INTO constraint_name_var
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = 'campaign_activities'
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%jenis_aktivitas%'
      LIMIT 1;
      
      IF constraint_name_var IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.campaign_activities DROP CONSTRAINT IF EXISTS %I', constraint_name_var);
      END IF;
    END;
  END IF;
END $$;

-- Alternative approach: Drop constraint by finding it directly
ALTER TABLE public.campaign_activities 
DROP CONSTRAINT IF EXISTS campaign_activities_jenis_aktivitas_check;

-- Step 2: Add the new constraint with updated activity types
ALTER TABLE public.campaign_activities 
ADD CONSTRAINT campaign_activities_jenis_aktivitas_check 
CHECK (jenis_aktivitas IN ('Initiate Call', 'Presentation', 'Demo', 'POC', 'Tender', 'Negotiation', 'Closing'));

-- Step 3: Update existing data if needed (optional - migrate old values to new ones)
-- Map old values to new values
UPDATE public.campaign_activities
SET jenis_aktivitas = 'Initiate Call'
WHERE jenis_aktivitas IN ('Chat customer', 'Pitch Product');

-- Verify the constraint
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
AND constraint_name LIKE '%jenis_aktivitas%';

-- Verify existing data
SELECT 
  jenis_aktivitas,
  COUNT(*) as count
FROM public.campaign_activities
GROUP BY jenis_aktivitas
ORDER BY jenis_aktivitas;

