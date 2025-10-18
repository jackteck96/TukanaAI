-- SECURITY FIX: Drop legacy invitations view
-- This view appears deprecated and poses a security risk

-- Drop the view
DROP VIEW IF EXISTS public.invitations CASCADE;