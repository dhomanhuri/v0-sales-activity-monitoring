-- Add Presales role to users table
-- This script updates the role constraint to include 'Presales'

-- Drop the existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with Presales role
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('Admin', 'GM', 'Sales', 'Presales'));

