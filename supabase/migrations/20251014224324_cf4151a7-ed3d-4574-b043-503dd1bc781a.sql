-- Corrigir funções de acesso para usar user_roles ao invés de profiles

-- Atualizar can_manage_company para verificar user_roles
CREATE OR REPLACE FUNCTION public.can_manage_company(user_uuid uuid, comp_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND company_id = comp_id
    AND role IN ('company_admin', 'company_collaborator')
  );
$$;

-- Atualizar can_access_process para usar user_roles
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
BEGIN
  SELECT company_id, client_email 
  INTO process_company, process_client_email
  FROM public.processes WHERE id = process_uuid;
  
  IF process_company IS NULL THEN RETURN FALSE; END IF;
  
  -- Verificar se é platform admin
  IF is_platform_admin(user_uuid) THEN RETURN TRUE; END IF;
  
  -- Verificar se pode gerenciar a empresa
  IF can_manage_company(user_uuid, process_company) THEN RETURN TRUE; END IF;
  
  -- Verificar se é o cliente do processo
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid
    AND role = 'client'
    AND client_email = process_client_email
  ) THEN RETURN TRUE; END IF;
  
  RETURN FALSE;
END;
$$;

-- Atualizar políticas RLS da tabela documents para usar user_roles
DROP POLICY IF EXISTS "Users can view documents from authorized processes" ON public.documents;
CREATE POLICY "Users can view documents from authorized processes"
ON public.documents
FOR SELECT
USING (
  can_access_process(process_id) OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND company_id = documents.company_id
    AND role IN ('company_admin', 'company_collaborator')
  )
);

DROP POLICY IF EXISTS "Users can create documents for authorized processes" ON public.documents;
CREATE POLICY "Users can create documents for authorized processes"
ON public.documents
FOR INSERT
WITH CHECK (
  can_access_process(process_id) OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND company_id = documents.company_id
    AND role IN ('company_admin', 'company_collaborator')
  )
);

DROP POLICY IF EXISTS "Users can update documents from authorized processes" ON public.documents;
CREATE POLICY "Users can update documents from authorized processes"
ON public.documents
FOR UPDATE
USING (
  can_access_process(process_id) OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND company_id = documents.company_id
    AND role IN ('company_admin', 'company_collaborator')
  )
);