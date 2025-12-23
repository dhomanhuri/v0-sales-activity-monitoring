-- Fix RLS policies for activity_targets table
-- This script fixes the incorrect RLS policies that were causing insert errors
-- Run this script in Supabase SQL Editor

-- Drop existing GM policies
DROP POLICY IF EXISTS "activity_targets_insert_gm" ON public.activity_targets;
DROP POLICY IF EXISTS "activity_targets_update_gm" ON public.activity_targets;
DROP POLICY IF EXISTS "activity_targets_delete_gm" ON public.activity_targets;
DROP POLICY IF EXISTS "activity_targets_select_gm" ON public.activity_targets;

-- Recreate GM policies with correct logic
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

