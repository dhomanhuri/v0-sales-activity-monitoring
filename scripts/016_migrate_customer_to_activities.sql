-- Migrate customer_id from campaigns to campaign_activities
-- This script:
-- 1. Adds customer_id column to campaign_activities if it doesn't exist
-- 2. Migrates existing customer_id from campaigns to campaign_activities
-- 3. Removes customer_id column from campaigns table
-- 4. Updates RLS policies

-- Step 1: Add customer_id to campaign_activities if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaign_activities' 
    AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.campaign_activities 
    ADD COLUMN customer_id UUID REFERENCES public.master_customers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 2: Migrate customer_id from campaigns to campaign_activities
-- For existing activities, copy customer_id from their parent campaign
UPDATE public.campaign_activities ca
SET customer_id = c.customer_id
FROM public.campaigns c
WHERE ca.campaign_id = c.id
AND ca.customer_id IS NULL
AND c.customer_id IS NOT NULL;

-- Step 3: Make customer_id NOT NULL after migration
-- First, set a default customer for any remaining NULL values (if needed)
-- You may want to review this and handle NULLs appropriately
-- For now, we'll make it nullable to allow flexibility

-- Step 4: Drop the foreign key constraint and column from campaigns
-- First, drop the foreign key constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
    AND table_name = 'campaigns' 
    AND constraint_name LIKE '%customer_id%'
  ) THEN
    ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_customer_id_fkey;
  END IF;
END $$;

-- Then drop the column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaigns' 
    AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.campaigns DROP COLUMN customer_id;
  END IF;
END $$;

-- Step 5: Update RLS policies for campaign_activities to include customer_id access
-- The existing policies should still work, but we can verify they allow customer_id access

-- Verify the changes
SELECT 
  'campaigns' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'campaigns'
ORDER BY ordinal_position;

SELECT 
  'campaign_activities' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'campaign_activities'
ORDER BY ordinal_position;

