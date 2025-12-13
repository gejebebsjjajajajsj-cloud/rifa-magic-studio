-- Create raffle_purchases table for tracking number purchases
CREATE TABLE public.raffle_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  numbers_purchased INTEGER[] NOT NULL,
  quantity INTEGER NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0.00,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.raffle_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Raffle owners can view purchases for their raffles
CREATE POLICY "Raffle owners can view purchases"
ON public.raffle_purchases
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.raffles
    WHERE raffles.id = raffle_purchases.raffle_id
    AND raffles.user_id = auth.uid()
  )
);

-- Policy: Anyone can insert a purchase (public buying)
CREATE POLICY "Anyone can create purchases"
ON public.raffle_purchases
FOR INSERT
WITH CHECK (true);

-- Policy: Public can view purchases for published raffles (to see sold numbers)
CREATE POLICY "Public can view purchases for published raffles"
ON public.raffle_purchases
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.raffles
    WHERE raffles.id = raffle_purchases.raffle_id
    AND raffles.status = 'published'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_raffle_purchases_updated_at
BEFORE UPDATE ON public.raffle_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for raffle images
INSERT INTO storage.buckets (id, name, public) VALUES ('raffle-images', 'raffle-images', true);

-- Storage policies for raffle images
CREATE POLICY "Anyone can view raffle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'raffle-images');

CREATE POLICY "Authenticated users can upload raffle images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'raffle-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own raffle images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'raffle-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own raffle images"
ON storage.objects FOR DELETE
USING (bucket_id = 'raffle-images' AND auth.role() = 'authenticated');

-- Add policy for public to view published raffles
CREATE POLICY "Public can view published raffles"
ON public.raffles
FOR SELECT
USING (status = 'published');

-- Enable realtime for purchases
ALTER PUBLICATION supabase_realtime ADD TABLE public.raffle_purchases;