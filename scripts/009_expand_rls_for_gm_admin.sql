-- Expand RLS so GM/Admin can read activities and customers for achievement calculation
BEGIN;

-- Activities: allow GM to SELECT activities of their sales team, and Admin to SELECT all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'activities' AND policyname = 'GMs and Admins see team activities'
  ) THEN
    CREATE POLICY "GMs and Admins see team activities" ON public.activities
      FOR SELECT
      USING (
        -- GM can see activities of their subordinates
        sales_id IN (SELECT id FROM public.users WHERE gm_id = auth.uid())
        OR
        -- Admin can see all
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
      );
  END IF;
END
$$;

-- Customers: allow GM to SELECT customers of their sales team, and Admin to SELECT all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'GMs and Admins see team customers'
  ) THEN
    CREATE POLICY "GMs and Admins see team customers" ON public.customers
      FOR SELECT
      USING (
        -- GM can see customers handled by their subordinates
        sales_id IN (SELECT id FROM public.users WHERE gm_id = auth.uid())
        OR
        -- Admin can see all
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
      );
  END IF;
END
$$;

COMMIT;


