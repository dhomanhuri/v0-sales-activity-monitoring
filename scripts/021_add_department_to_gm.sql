-- Add Department field for GM role
-- This script adds a department column to the users table for GM role

-- Add department column (nullable, can be NULL for non-GM users)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.users.department IS 'Department field for General Manager (GM) role';

