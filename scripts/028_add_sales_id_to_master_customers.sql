-- Add sales_id column to master_customers table
-- This makes master customers specific to a sales person

-- Add sales_id column (nullable for backward compatibility, but should be set for new records)
ALTER TABLE public.master_customers 
ADD COLUMN IF NOT EXISTS sales_id UUID REFERENCES public.users(id) ON DELETE CASCADE;

-- Add comment to explain the field
COMMENT ON COLUMN public.master_customers.sales_id IS 'Sales person who owns this master customer';

-- Update RLS policies to filter by sales_id
-- Drop existing policies
DROP POLICY IF EXISTS "master_customers_select" ON public.master_customers;
DROP POLICY IF EXISTS "master_customers_insert" ON public.master_customers;
DROP POLICY IF EXISTS "master_customers_update" ON public.master_customers;
DROP POLICY IF EXISTS "master_customers_delete" ON public.master_customers;

-- New RLS policies with sales_id filtering
-- Admin can see all, GM can see their team's customers, Sales can only see their own
CREATE POLICY "master_customers_select" ON public.master_customers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
  OR sales_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('GM', 'GM Non Sales')
    AND id IN (
      SELECT gm_id FROM public.users WHERE id = master_customers.sales_id
    )
  )
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('Presales', 'Engineer'))
);

-- Insert: Admin can insert for any sales, GM can insert for their team, Sales can insert for themselves
CREATE POLICY "master_customers_insert" ON public.master_customers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
  OR sales_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('GM', 'GM Non Sales')
    AND id IN (
      SELECT gm_id FROM public.users WHERE id = sales_id
    )
  )
);

-- Update: Admin can update all, GM can update their team's, Sales can update their own
CREATE POLICY "master_customers_update" ON public.master_customers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
  OR sales_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('GM', 'GM Non Sales')
    AND id IN (
      SELECT gm_id FROM public.users WHERE id = master_customers.sales_id
    )
  )
);

-- Delete: Admin can delete all, GM can delete their team's, Sales can delete their own
CREATE POLICY "master_customers_delete" ON public.master_customers FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
  OR sales_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('GM', 'GM Non Sales')
    AND id IN (
      SELECT gm_id FROM public.users WHERE id = master_customers.sales_id
    )
  )
);

