-- ====================================
-- MIGRATION: Sistema de Roles Seguro
-- ====================================

-- 1. Criar enum de roles
CREATE TYPE public.app_role AS ENUM (
  'platform_admin',
  'company_admin', 
  'company_collaborator',
  'client',
  'client_collaborator'
);

-- 2. Criar tabela user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  client_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, company_id, client_email)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Funções security definer
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid UUID)
RETURNS SETOF app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, check_role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = check_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(user_uuid UUID, check_roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = ANY(check_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT has_role(user_uuid, 'platform_admin');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_company(user_uuid UUID, comp_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND company_id = comp_id
    AND role IN ('company_admin', 'company_collaborator')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_details(user_uuid UUID)
RETURNS TABLE (role TEXT, company_id UUID, client_email TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role::TEXT, company_id, client_email
  FROM public.user_roles WHERE user_id = user_uuid;
$$;

-- 4. Policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Platform admins can manage all"
ON public.user_roles FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- 5. Migrar dados existentes
INSERT INTO public.user_roles (user_id, role, company_id)
SELECT 
  p.id,
  CASE 
    WHEN p.role = 'admin' AND p.company_id IS NULL THEN 'platform_admin'::app_role
    WHEN p.role = 'admin' AND p.company_id IS NOT NULL THEN 'company_admin'::app_role
    WHEN p.role IN ('lawyer', 'staff') THEN 'company_collaborator'::app_role
    WHEN p.role = 'client' THEN 'client'::app_role
  END,
  p.company_id
FROM public.profiles p
WHERE p.role IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Atualizar can_access_process
CREATE OR REPLACE FUNCTION public.can_access_process(process_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_uuid UUID := auth.uid();
  process_company UUID;
  process_client_email TEXT;
BEGIN
  SELECT company_id, client_email 
  INTO process_company, process_client_email
  FROM public.processes WHERE id = process_uuid;
  
  IF process_company IS NULL THEN RETURN FALSE; END IF;
  
  IF is_platform_admin(user_uuid) THEN RETURN TRUE; END IF;
  IF can_manage_company(user_uuid, process_company) THEN RETURN TRUE; END IF;
  
  RETURN FALSE;
END;
$$;

-- 7. Trigger e índices
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_company_id ON public.user_roles(company_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);