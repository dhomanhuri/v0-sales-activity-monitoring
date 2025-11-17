-- New schema for Campaign-based system
-- This replaces the old customer/activity structure
-- 
-- IMPORTANT: This script requires that the users table already exists!
-- Make sure to run scripts/001_create_tables.sql first to create the users table.
-- If you get an error about "relation public.users does not exist", 
-- you need to run 001_create_tables.sql first.

BEGIN;

-- Check if users table exists, if not, create a minimal one
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      nama_lengkap TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('Admin', 'GM', 'Sales')),
      gm_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
      status_aktif BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Master Customers table (simplified)
CREATE TABLE IF NOT EXISTS public.master_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Master Campaigns table
CREATE TABLE IF NOT EXISTS public.master_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campaigns table (links customer, campaign type, sales, and target)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.master_customers(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.master_campaigns(id) ON DELETE CASCADE,
  sales_id UUID NOT NULL REFERENCES public.users(id),
  target_revenue NUMERIC(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Campaign Activities table
CREATE TABLE IF NOT EXISTS public.campaign_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  jenis_aktivitas TEXT NOT NULL CHECK (jenis_aktivitas IN ('Pitch Product', 'Tender')),
  keterangan TEXT,
  potential_value NUMERIC(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.master_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Master Customers (all authenticated users can view, only Admin can modify)
CREATE POLICY "master_customers_select" ON public.master_customers FOR SELECT USING (true);
CREATE POLICY "master_customers_insert" ON public.master_customers FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "master_customers_update" ON public.master_customers FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "master_customers_delete" ON public.master_customers FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));

-- RLS Policies for Master Campaigns (all authenticated users can view, only Admin can modify)
CREATE POLICY "master_campaigns_select" ON public.master_campaigns FOR SELECT USING (true);
CREATE POLICY "master_campaigns_insert" ON public.master_campaigns FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "master_campaigns_update" ON public.master_campaigns FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "master_campaigns_delete" ON public.master_campaigns FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));

-- RLS Policies for Campaigns
-- Sales see own campaigns, GM see team campaigns, Admin see all
CREATE POLICY "campaigns_select_sales" ON public.campaigns FOR SELECT 
  USING (sales_id = auth.uid());
CREATE POLICY "campaigns_select_gm" ON public.campaigns FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'GM' AND id IN (
      SELECT gm_id FROM public.users WHERE id = campaigns.sales_id
    )
  ));
CREATE POLICY "campaigns_select_admin" ON public.campaigns FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "campaigns_insert" ON public.campaigns FOR INSERT 
  WITH CHECK (sales_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'GM')));
CREATE POLICY "campaigns_update" ON public.campaigns FOR UPDATE 
  USING (sales_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'GM')));
CREATE POLICY "campaigns_delete" ON public.campaigns FOR DELETE 
  USING (sales_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'GM')));

-- RLS Policies for Campaign Activities
-- Same access as campaigns
CREATE POLICY "campaign_activities_select_sales" ON public.campaign_activities FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_activities.campaign_id AND campaigns.sales_id = auth.uid()
  ));
CREATE POLICY "campaign_activities_select_gm" ON public.campaign_activities FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    JOIN public.users ON users.id = campaigns.sales_id
    WHERE campaigns.id = campaign_activities.campaign_id 
    AND users.gm_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'GM')
  ));
CREATE POLICY "campaign_activities_select_admin" ON public.campaign_activities FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'));
CREATE POLICY "campaign_activities_insert" ON public.campaign_activities FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_activities.campaign_id 
    AND (campaigns.sales_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'GM')))
  ));
CREATE POLICY "campaign_activities_update" ON public.campaign_activities FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_activities.campaign_id 
    AND (campaigns.sales_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'GM')))
  ));
CREATE POLICY "campaign_activities_delete" ON public.campaign_activities FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_activities.campaign_id 
    AND (campaigns.sales_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'GM')))
  ));

COMMIT;

