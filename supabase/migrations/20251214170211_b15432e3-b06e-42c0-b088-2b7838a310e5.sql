-- Add SyncPayments credentials to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS syncpayments_client_id TEXT,
ADD COLUMN IF NOT EXISTS syncpayments_client_secret TEXT;