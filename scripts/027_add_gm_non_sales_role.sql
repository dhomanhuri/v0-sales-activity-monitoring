-- Add GM Non Sales role to users table
-- This script updates the role constraint to include 'GM Non Sales'

-- Drop the existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new constraint with GM Non Sales role
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('Admin', 'GM', 'GM Non Sales', 'Sales', 'Presales', 'Engineer'));

