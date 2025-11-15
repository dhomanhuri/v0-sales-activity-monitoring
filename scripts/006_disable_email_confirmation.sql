-- Disable email confirmation requirement in Supabase Auth
-- This allows users to login immediately without confirming their email first

-- Update auth.users to mark all users as email_confirmed
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- Note: To completely disable email confirmation for new sign-ups, you need to:
-- 1. Go to Supabase Dashboard > Authentication > Providers > Email
-- 2. Toggle OFF "Confirm email"
-- This SQL script handles existing users who haven't confirmed yet
