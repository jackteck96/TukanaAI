-- Atualizar função can_access_process para incluir verificação de permissões de colaboradores
CREATE OR REPLACE FUNCTION public.can_access_process(process_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid UUID := auth.uid();
  process_company UUID;
  process_client_email TEXT;
  user_email TEXT;
BEGIN
  SELECT company_id, client_email 
  INTO process_company, process_client_email
  FROM public.processes WHERE id = process_uuid;
  
  IF process_company IS NULL THEN RETURN FALSE; END IF;
  
  -- Platform admin tem acesso
  IF is_platform_admin(user_uuid) THEN RETURN TRUE; END IF;
  
  -- Administradores da empresa dona do processo
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid
      AND company_id = process_company
      AND role = 'company_admin'
  ) THEN RETURN TRUE; END IF;
  
  -- Colaboradores da empresa com permissão para este processo
  IF collaborator_can_access_process(user_uuid, process_uuid) THEN
    RETURN TRUE;
  END IF;
  
  -- Cliente dono do processo (via user_roles)
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid
      AND role = 'client'
      AND client_email = process_client_email
  ) THEN RETURN TRUE; END IF;

  -- Cliente do processo (via profiles.email) - fallback legado
  SELECT email INTO user_email FROM public.profiles WHERE id = user_uuid;
  IF user_email IS NOT NULL AND user_email = process_client_email THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;