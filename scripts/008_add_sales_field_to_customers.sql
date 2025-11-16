-- Add achievement_revenue column to targets table if it doesn't exist
ALTER TABLE public.targets
ADD COLUMN IF NOT EXISTS achievement_revenue NUMERIC(15, 2) DEFAULT 0;

-- Create trigger function to update target achievement when customer status changes to Closed Won
CREATE OR REPLACE FUNCTION update_target_achievement()
RETURNS TRIGGER AS $$
DECLARE
  sales_gm_id UUID;
  current_year TEXT;
BEGIN
  -- When customer status changes to 'Closed Won', add the nilai_potensial to target achievement
  IF NEW.status_pipeline = 'Closed Won' AND OLD.status_pipeline != 'Closed Won' THEN
    -- Get GM ID for this sales
    SELECT gm_id INTO sales_gm_id FROM public.users WHERE id = NEW.sales_id;
    
    -- Get current year for target period
    current_year := TO_CHAR(NOW(), 'YYYY');
    
    -- Update target achievement_revenue
    UPDATE public.targets
    SET achievement_revenue = COALESCE(achievement_revenue, 0) + NEW.nilai_potensial
    WHERE sales_id = NEW.sales_id 
    AND gm_id = sales_gm_id
    AND periode_tahun = current_year;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on customers table
DROP TRIGGER IF EXISTS customer_closed_won_trigger ON public.customers;
CREATE TRIGGER customer_closed_won_trigger
AFTER UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION update_target_achievement();
