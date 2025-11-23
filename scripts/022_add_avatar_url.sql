-- Add avatar_url field to users table
-- This script adds an avatar_url column to store profile photo URLs

-- Add avatar_url column (nullable)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user profile photo/avatar stored in Supabase Storage';


