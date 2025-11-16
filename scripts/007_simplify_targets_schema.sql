-- Simplify targets table to only include revenue target
-- Remove lead, proposal, and closing target columns

BEGIN;

-- Drop the old targets table
DROP TABLE IF EXISTS public.targets CASCADE;

-- Create new simplified targets table
CREATE TABLE IF NOT EXISTS public.targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_id UUID NOT NULL REFERENCES public.users(id),
  gm_id UUID NOT NULL REFERENCES public.users(id),
  periode_tahun INTEGER NOT NULL,
  target_nilai_revenue NUMERIC(15, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(sales_id, periode_tahun)
);

-- Enable RLS
ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: GMs see their team targets, Admins see all
CREATE POLICY "GMs and Admins see targets" ON public.targets FOR SELECT USING (
  gm_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- RLS Policy: Allow insert for targets creation
CREATE POLICY "Allow target creation" ON public.targets FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'
  ) OR
  gm_id = auth.uid()
);

-- RLS Policy: Allow update
CREATE POLICY "Allow target updates" ON public.targets FOR UPDATE USING (
  gm_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- RLS Policy: Allow delete
CREATE POLICY "Allow target deletion" ON public.targets FOR DELETE USING (
  gm_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'
  )
);

COMMIT;
