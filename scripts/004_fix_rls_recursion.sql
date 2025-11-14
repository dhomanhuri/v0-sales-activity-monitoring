-- Drop ALL existing policies to remove infinite recursion issue
DROP POLICY IF EXISTS "Sales see own customers" ON public.customers;
DROP POLICY IF EXISTS "Sales can insert own customers" ON public.customers;
DROP POLICY IF EXISTS "All authenticated users can view activity types" ON public.activity_types;
DROP POLICY IF EXISTS "Sales see own activities" ON public.activities;
DROP POLICY IF EXISTS "Sales can insert own activities" ON public.activities;
DROP POLICY IF EXISTS "GMs see their team targets" ON public.targets;

-- Disable RLS on users table completely to allow fetching user data
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- For other tables, keep RLS enabled but with simple policies that don't cause recursion

-- Customers: Sales can only see their own customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_select_sales" ON public.customers FOR SELECT 
  USING (sales_id = auth.uid());
CREATE POLICY "customers_insert" ON public.customers FOR INSERT 
  WITH CHECK (sales_id = auth.uid());
CREATE POLICY "customers_update" ON public.customers FOR UPDATE 
  USING (sales_id = auth.uid());
CREATE POLICY "customers_delete" ON public.customers FOR DELETE 
  USING (sales_id = auth.uid());

-- Activity types: All authenticated users can view
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_types_select" ON public.activity_types FOR SELECT 
  USING (true);

-- Activities: Sales can only see their own activities
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_select" ON public.activities FOR SELECT 
  USING (sales_id = auth.uid());
CREATE POLICY "activities_insert" ON public.activities FOR INSERT 
  WITH CHECK (sales_id = auth.uid());
CREATE POLICY "activities_update" ON public.activities FOR UPDATE 
  USING (sales_id = auth.uid());
CREATE POLICY "activities_delete" ON public.activities FOR DELETE 
  USING (sales_id = auth.uid());

-- Targets: GMs can see their team's targets
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "targets_select" ON public.targets FOR SELECT 
  USING (gm_id = auth.uid());
CREATE POLICY "targets_insert" ON public.targets FOR INSERT 
  WITH CHECK (gm_id = auth.uid());
CREATE POLICY "targets_update" ON public.targets FOR UPDATE 
  USING (gm_id = auth.uid());
CREATE POLICY "targets_delete" ON public.targets FOR DELETE 
  USING (gm_id = auth.uid());
