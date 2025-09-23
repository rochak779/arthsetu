-- Create kite_holdings table
CREATE TABLE public.kite_holdings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  instrument_token bigint NOT NULL,
  tradingsymbol text NOT NULL,
  exchange text NOT NULL,
  quantity integer NOT NULL,
  average_price numeric NOT NULL,
  last_price numeric NOT NULL,
  pnl numeric NOT NULL,
  product text NOT NULL,
  collateral_quantity integer NOT NULL DEFAULT 0,
  t1_quantity integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL,
  UNIQUE(user_id, instrument_token)
);

-- Enable RLS for kite_holdings
ALTER TABLE public.kite_holdings ENABLE ROW LEVEL SECURITY;

-- Create policies for kite_holdings
CREATE POLICY "Users can view their own holdings" 
ON public.kite_holdings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own holdings" 
ON public.kite_holdings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holdings" 
ON public.kite_holdings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own holdings" 
ON public.kite_holdings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add columns to existing users table
ALTER TABLE public.users 
ADD COLUMN kite_accesstoken text,
ADD COLUMN last_login_date timestamptz;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on kite_holdings
CREATE TRIGGER update_kite_holdings_updated_at
BEFORE UPDATE ON public.kite_holdings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();