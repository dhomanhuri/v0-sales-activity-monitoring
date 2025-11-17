-- Add tanggal_aktivitas column to campaign_activities table
-- Run this script to add date field for activities

-- Add column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaign_activities' 
    AND column_name = 'tanggal_aktivitas'
  ) THEN
    ALTER TABLE public.campaign_activities 
    ADD COLUMN tanggal_aktivitas DATE NOT NULL DEFAULT CURRENT_DATE;
    
    -- Update existing records to use created_at date
    UPDATE public.campaign_activities 
    SET tanggal_aktivitas = created_at::DATE 
    WHERE tanggal_aktivitas IS NULL;
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
AND column_name = 'tanggal_aktivitas';

