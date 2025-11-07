-- Criar função RPC para obter IDs de processos acessíveis para o usuário atual
CREATE OR REPLACE FUNCTION public.get_accessible_process_ids()
RETURNS TABLE(process_id UUID)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid UUID := auth.uid();
  user_email TEXT;
BEGIN
  -- Se não estiver autenticado, retornar vazio
  IF user_uuid IS NULL THEN
    RETURN;
  END IF;

  -- Platform admin vê todos os processos
  IF is_platform_admin(user_uuid) THEN
    RETURN QUERY SELECT id FROM public.processes;
    RETURN;
  END IF;

  -- Retornar processos baseado em permissões
  RETURN QUERY
  SELECT DISTINCT p.id
  FROM public.processes p
  LEFT JOIN public.user_roles ur_company ON 
    ur_company.user_id = user_uuid AND
    ur_company.company_id = p.company_id AND
    ur_company.role = 'company_admin'
  LEFT JOIN public.collaborator_permissions cp ON 
    cp.user_id = user_uuid AND
    (cp.company_id = p.company_id OR cp.client_email = p.client_email)
  LEFT JOIN public.collaborator_process_access cpa ON 
    cpa.permission_id = cp.id AND
    cpa.process_id = p.id
  LEFT JOIN public.user_roles ur_client ON 
    ur_client.user_id = user_uuid AND
    ur_client.role = 'client' AND
    ur_client.client_email = p.client_email
  LEFT JOIN public.profiles prof ON 
    prof.id = user_uuid AND
    prof.email = p.client_email
  WHERE 
    -- Company admin
    ur_company.id IS NOT NULL OR
    -- Colaborador com acesso total
    (cp.id IS NOT NULL AND cp.access_type = 'full') OR
    -- Colaborador com acesso limitado a este processo
    (cp.id IS NOT NULL AND cp.access_type = 'limited' AND cpa.id IS NOT NULL) OR
    -- Cliente dono do processo (via user_roles)
    ur_client.id IS NOT NULL OR
    -- Cliente dono do processo (via profiles - fallback legado)
    prof.id IS NOT NULL;
END;
$$;