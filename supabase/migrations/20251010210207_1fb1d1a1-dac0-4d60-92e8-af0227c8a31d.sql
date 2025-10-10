-- Create admin invites table
CREATE TABLE public.admin_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  full_name text NOT NULL,
  invited_by uuid NOT NULL,
  approval_token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  approved_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Only platform admins can view admin invites
CREATE POLICY "Platform admins can view admin invites"
ON public.admin_invites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND company_id IS NULL
  )
);

-- Only platform admins can create admin invites
CREATE POLICY "Platform admins can create admin invites"
ON public.admin_invites
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND company_id IS NULL
  )
);

-- Only platform admins can update admin invites
CREATE POLICY "Platform admins can update admin invites"
ON public.admin_invites
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND company_id IS NULL
  )
);