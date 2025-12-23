-- Create Activity Targets table
-- This table stores activity targets set by GM for their team members
-- Run this script in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.activity_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  sales_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gm_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  jenis_aktivitas TEXT NOT NULL CHECK (jenis_aktivitas IN ('Initiate Call', 'Presentation', 'Demo', 'POC', 'Tender', 'Negotiation', 'Closing')),
  target_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, sales_id, jenis_aktivitas)
);

-- Enable RLS
ALTER TABLE public.activity_targets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "activity_targets_select_sales" ON public.activity_targets;
DROP POLICY IF EXISTS "activity_targets_select_gm" ON public.activity_targets;
DROP POLICY IF EXISTS "activity_targets_select_admin" ON public.activity_targets;
DROP POLICY IF EXISTS "activity_targets_insert_gm" ON public.activity_targets;
DROP POLICY IF EXISTS "activity_targets_update_gm" ON public.activity_targets;
DROP POLICY IF EXISTS "activity_targets_delete_gm" ON public.activity_targets;
DROP POLICY IF EXISTS "activity_targets_insert_admin" ON public.activity_targets;
DROP POLICY IF EXISTS "activity_targets_update_admin" ON public.activity_targets;
DROP POLICY IF EXISTS "activity_targets_delete_admin" ON public.activity_targets;

-- RLS Policies for Activity Targets
-- Sales can view their own targets
CREATE POLICY "activity_targets_select_sales" ON public.activity_targets FOR SELECT
  USING (sales_id = auth.uid());

-- GM can view targets for their team members
CREATE POLICY "activity_targets_select_gm" ON public.activity_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('GM', 'GM Non Sales')
    )
    AND gm_id = auth.uid()
  );

-- Admin can view all targets
CREATE POLICY "activity_targets_select_admin" ON public.activity_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

-- GM can insert targets for their team members
CREATE POLICY "activity_targets_insert_gm" ON public.activity_targets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('GM', 'GM Non Sales')
    )
    AND gm_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = sales_id 
      AND gm_id = auth.uid()
    )
  );

-- GM can update targets for their team members
CREATE POLICY "activity_targets_update_gm" ON public.activity_targets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('GM', 'GM Non Sales')
    )
    AND gm_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('GM', 'GM Non Sales')
    )
    AND gm_id = auth.uid()
  );

-- GM can delete targets for their team members
CREATE POLICY "activity_targets_delete_gm" ON public.activity_targets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('GM', 'GM Non Sales')
    )
    AND gm_id = auth.uid()
  );

-- Admin can insert, update, and delete all targets
CREATE POLICY "activity_targets_insert_admin" ON public.activity_targets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

CREATE POLICY "activity_targets_update_admin" ON public.activity_targets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

CREATE POLICY "activity_targets_delete_admin" ON public.activity_targets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_targets_campaign_id ON public.activity_targets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_activity_targets_sales_id ON public.activity_targets(sales_id);
CREATE INDEX IF NOT EXISTS idx_activity_targets_gm_id ON public.activity_targets(gm_id);
CREATE INDEX IF NOT EXISTS idx_activity_targets_target_date ON public.activity_targets(target_date);

