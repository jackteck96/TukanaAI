-- Remover coluna legada firm_id da tabela profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS firm_id;

-- Adicionar índices para melhorar performance de queries filtradas por company_id
CREATE INDEX IF NOT EXISTS idx_processes_company_id ON public.processes(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON public.user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_collaborator_permissions_company_id ON public.collaborator_permissions(company_id);

-- Adicionar índice composto para queries comuns de user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_company ON public.user_roles(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_company ON public.user_roles(role, company_id);

-- Adicionar search_path às funções que estavam faltando para segurança
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN replace(gen_random_uuid()::text, '-', '');
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(user_uuid uuid, check_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = check_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_any_role(user_uuid uuid, check_roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = ANY(check_roles)
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT has_role(user_uuid, 'platform_admin');
$function$;

CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid uuid)
RETURNS SETOF app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role_details(user_uuid uuid)
RETURNS TABLE(role text, company_id uuid, client_email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role::TEXT, company_id, client_email
  FROM public.user_roles WHERE user_id = user_uuid;
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_company(user_uuid uuid, comp_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND company_id = comp_id
    AND role IN ('company_admin', 'company_collaborator')
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles
    WHERE user_id = _user_id 
      AND company_id = _company_id
      AND role IN ('company_admin', 'company_collaborator')
  );
$function$;