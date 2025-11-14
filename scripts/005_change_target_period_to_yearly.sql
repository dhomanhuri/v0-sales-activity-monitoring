-- Migrate targets table from monthly to yearly period

-- Add new periode_tahun column
ALTER TABLE public.targets 
ADD COLUMN periode_tahun INTEGER;

-- Migrate existing data from periode_bulan to periode_tahun
UPDATE public.targets 
SET periode_tahun = CAST(SUBSTRING(periode_bulan, LENGTH(periode_bulan) - 3) AS INTEGER)
WHERE periode_tahun IS NULL;

-- Drop the old unique constraint
ALTER TABLE public.targets 
DROP CONSTRAINT targets_sales_id_periode_bulan_key;

-- Update RLS policy for targets table
DROP POLICY IF EXISTS "GMs see their team targets" ON public.targets;
CREATE POLICY "GMs see their team targets" ON public.targets FOR SELECT USING (
  gm_id = auth.uid()
);

-- Make periode_tahun NOT NULL and drop periode_bulan
ALTER TABLE public.targets 
ALTER COLUMN periode_tahun SET NOT NULL;

ALTER TABLE public.targets 
DROP COLUMN periode_bulan;

-- Add new unique constraint with periode_tahun
ALTER TABLE public.targets 
ADD CONSTRAINT targets_sales_id_periode_tahun_key UNIQUE(sales_id, periode_tahun);
