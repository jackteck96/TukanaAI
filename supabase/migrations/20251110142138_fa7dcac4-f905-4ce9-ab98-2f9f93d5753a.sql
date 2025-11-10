-- Fix infinite recursion in user_roles RLS policies
-- Remove problematic policies and create security definer function

-- Drop the problematic policies
DROP POLICY IF EXISTS "Company admins can view company roles" ON public.user_roles;
DROP POLICY IF EXISTS "Clients can view their collaborator roles" ON public.user_roles;

-- Create security definer function to check user roles without triggering RLS
CREATE OR REPLACE FUNCTION public.user_has_company_admin_role(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role = 'company_admin'::app_role
  )
$$;

-- Create security definer function to check if user is client
CREATE OR REPLACE FUNCTION public.user_has_client_role(_user_id uuid, _client_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND client_email = _client_email
      AND role = 'client'::app_role
  )
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Company admins can view company roles"
ON public.user_roles
FOR SELECT
USING (
  (company_id IS NOT NULL)
  AND public.user_has_company_admin_role(auth.uid(), company_id)
);

CREATE POLICY "Clients can view their collaborator roles"
ON public.user_roles
FOR SELECT
USING (
  (client_email IS NOT NULL)
  AND public.user_has_client_role(auth.uid(), client_email)
);