-- Add integration tokens to users for status display
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS groww_accesstoken text;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS upstox_accesstoken text;