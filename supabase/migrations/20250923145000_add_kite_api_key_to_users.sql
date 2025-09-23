-- Add kite_api_key to users to ensure holdings calls use the same API key used during token exchange
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS kite_api_key text;

-- No change to RLS policies required since existing policies govern row access