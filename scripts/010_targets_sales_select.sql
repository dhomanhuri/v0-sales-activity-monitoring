-- Allow Sales to SELECT their own targets
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'targets' AND policyname = 'Sales see own targets'
  ) THEN
    CREATE POLICY "Sales see own targets" ON public.targets
      FOR SELECT
      USING (sales_id = auth.uid());
  END IF;
END
$$;

COMMIT;


