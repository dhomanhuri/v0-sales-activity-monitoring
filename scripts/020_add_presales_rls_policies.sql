-- Add RLS policies for Presales role
-- This script allows Presales to view all campaigns and campaign activities (read-only)
-- IMPORTANT: Run script 019_add_presales_role.sql first to add Presales role to users table

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "campaigns_select_presales" ON public.campaigns;
DROP POLICY IF EXISTS "campaign_activities_select_presales" ON public.campaign_activities;

-- RLS Policy for Campaigns - Presales can view all campaigns (read-only)
CREATE POLICY "campaigns_select_presales" ON public.campaigns 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Presales')
  );

-- RLS Policy for Campaign Activities - Presales can view all campaign activities (read-only)
CREATE POLICY "campaign_activities_select_presales" ON public.campaign_activities 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Presales')
  );

