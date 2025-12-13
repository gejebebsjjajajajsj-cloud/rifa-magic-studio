-- Create raffles table
CREATE TABLE public.raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  end_date TIMESTAMP WITH TIME ZONE,
  total_numbers INTEGER NOT NULL DEFAULT 100,
  price_per_number DECIMAL(10,2) NOT NULL DEFAULT 10.00,
  image_url TEXT,
  banner_url TEXT,
  primary_color TEXT DEFAULT '#FF6B9D',
  button_color TEXT DEFAULT '#FF6B9D',
  pix_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_payment', 'published', 'completed', 'cancelled')),
  numbers_sold INTEGER NOT NULL DEFAULT 0,
  total_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own raffles"
ON public.raffles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own raffles"
ON public.raffles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own raffles"
ON public.raffles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own raffles"
ON public.raffles FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_raffles_updated_at
BEFORE UPDATE ON public.raffles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();