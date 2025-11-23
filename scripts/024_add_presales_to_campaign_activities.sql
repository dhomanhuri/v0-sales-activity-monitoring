-- Add presales column to campaign_activities table
-- This script adds a presales column to store multiple presales (as JSON array)
-- Run this script in Supabase SQL Editor

-- Add presales column (nullable, stores JSON array of presales IDs)
ALTER TABLE public.campaign_activities 
ADD COLUMN IF NOT EXISTS presales JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the field
COMMENT ON COLUMN public.campaign_activities.presales IS 'JSON array of presales user IDs for labeling purposes';

-- Create index for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_campaign_activities_presales ON public.campaign_activities USING GIN (presales);

