-- Create table for prize numbers configuration
CREATE TABLE public.prize_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  prize_value NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  numbers INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prize_numbers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Raffle owners can manage prize numbers"
ON public.prize_numbers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.raffles
    WHERE raffles.id = prize_numbers.raffle_id
    AND raffles.user_id = auth.uid()
  )
);

CREATE POLICY "Public can view prize numbers for published raffles"
ON public.prize_numbers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.raffles
    WHERE raffles.id = prize_numbers.raffle_id
    AND raffles.status = 'published'
  )
);

-- Index for faster lookups
CREATE INDEX idx_prize_numbers_raffle_id ON public.prize_numbers(raffle_id);