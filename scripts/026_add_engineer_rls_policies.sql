-- Add RLS policies for Engineer role
-- This script allows Engineer to view all campaigns and campaign activities (read-only)
-- IMPORTANT: Run script 025_add_engineer_role.sql first to add Engineer role to users table

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "campaigns_select_engineer" ON public.campaigns;
DROP POLICY IF EXISTS "campaign_activities_select_engineer" ON public.campaign_activities;

-- RLS Policy for Campaigns - Engineer can view all campaigns (read-only)
CREATE POLICY "campaigns_select_engineer" ON public.campaigns 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Engineer')
  );

-- RLS Policy for Campaign Activities - Engineer can view all campaign activities (read-only)
CREATE POLICY "campaign_activities_select_engineer" ON public.campaign_activities 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Engineer')
  );

