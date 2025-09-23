-- Add email_verifiedat field to users table
ALTER TABLE public.users 
ADD COLUMN email_verifiedat TIMESTAMP WITH TIME ZONE;