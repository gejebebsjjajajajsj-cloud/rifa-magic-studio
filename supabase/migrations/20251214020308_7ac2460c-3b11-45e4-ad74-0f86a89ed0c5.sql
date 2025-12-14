-- Add support_phone column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS support_phone text;

-- Add mercado_pago_access_token column to profiles for payment integration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mercado_pago_access_token text;