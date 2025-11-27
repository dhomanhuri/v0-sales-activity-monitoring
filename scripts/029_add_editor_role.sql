-- Add Editor role to users table
-- This script updates the role constraint to include 'Editor' and adds RLS policies

-- Drop the existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with Editor role
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('Admin', 'GM', 'GM Non Sales', 'Sales', 'Presales', 'Engineer', 'Editor'));

-- RLS Policies for Master Customers (Editor can modify)
DROP POLICY IF EXISTS "master_customers_insert" ON public.master_customers;
DROP POLICY IF EXISTS "master_customers_update" ON public.master_customers;
DROP POLICY IF EXISTS "master_customers_delete" ON public.master_customers;

CREATE POLICY "master_customers_insert" ON public.master_customers FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Editor')));
CREATE POLICY "master_customers_update" ON public.master_customers FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Editor')));
CREATE POLICY "master_customers_delete" ON public.master_customers FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Editor')));

-- RLS Policies for Master Campaigns (Editor can modify)
DROP POLICY IF EXISTS "master_campaigns_insert" ON public.master_campaigns;
DROP POLICY IF EXISTS "master_campaigns_update" ON public.master_campaigns;
DROP POLICY IF EXISTS "master_campaigns_delete" ON public.master_campaigns;

CREATE POLICY "master_campaigns_insert" ON public.master_campaigns FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Editor')));
CREATE POLICY "master_campaigns_update" ON public.master_campaigns FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Editor')));
CREATE POLICY "master_campaigns_delete" ON public.master_campaigns FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Admin', 'Editor')));

