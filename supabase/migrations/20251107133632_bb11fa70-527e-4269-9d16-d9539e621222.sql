-- Criar tabela de permissões de colaboradores
CREATE TABLE IF NOT EXISTS public.collaborator_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  client_email TEXT,
  access_type TEXT NOT NULL CHECK (access_type IN ('full', 'limited')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT collaborator_permissions_context_check CHECK (
    (company_id IS NOT NULL AND client_email IS NULL) OR
    (company_id IS NULL AND client_email IS NOT NULL)
  )
);

-- Criar tabela de processos permitidos para colaboradores com acesso limitado
CREATE TABLE IF NOT EXISTS public.collaborator_process_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_id UUID NOT NULL REFERENCES public.collaborator_permissions(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(permission_id, process_id)
);

-- Habilitar RLS
ALTER TABLE public.collaborator_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_process_access ENABLE ROW LEVEL SECURITY;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_collaborator_permissions_user_id ON public.collaborator_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborator_permissions_company_id ON public.collaborator_permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_collaborator_permissions_client_email ON public.collaborator_permissions(client_email);
CREATE INDEX IF NOT EXISTS idx_collaborator_process_access_permission_id ON public.collaborator_process_access(permission_id);
CREATE INDEX IF NOT EXISTS idx_collaborator_process_access_process_id ON public.collaborator_process_access(process_id);

-- Função para verificar se um colaborador tem acesso a um processo
CREATE OR REPLACE FUNCTION public.collaborator_can_access_process(
  _user_id UUID,
  _process_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  permission_record RECORD;
BEGIN
  -- Buscar permissão do usuário para este processo
  SELECT cp.access_type, cp.id, p.company_id, p.client_email
  INTO permission_record
  FROM public.collaborator_permissions cp
  JOIN public.processes p ON (
    (cp.company_id IS NOT NULL AND cp.company_id = p.company_id) OR
    (cp.client_email IS NOT NULL AND cp.client_email = p.client_email)
  )
  WHERE cp.user_id = _user_id 
    AND p.id = _process_id
  LIMIT 1;

  -- Se não há permissão configurada, negar acesso
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Se tem acesso total, permitir
  IF permission_record.access_type = 'full' THEN
    RETURN TRUE;
  END IF;

  -- Se tem acesso limitado, verificar se este processo específico está autorizado
  IF permission_record.access_type = 'limited' THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.collaborator_process_access
      WHERE permission_id = permission_record.id
        AND process_id = _process_id
    );
  END IF;

  RETURN FALSE;
END;
$$;

-- RLS Policies para collaborator_permissions

-- Admins da empresa podem ver permissões de colaboradores da sua empresa
CREATE POLICY "Company admins can view company collaborator permissions"
ON public.collaborator_permissions
FOR SELECT
TO authenticated
USING (
  company_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'company_admin'
      AND user_roles.company_id = collaborator_permissions.company_id
  )
);

-- Clientes podem ver permissões de seus colaboradores
CREATE POLICY "Clients can view their collaborator permissions"
ON public.collaborator_permissions
FOR SELECT
TO authenticated
USING (
  client_email IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'client'
      AND user_roles.client_email = collaborator_permissions.client_email
  )
);

-- Colaboradores podem ver suas próprias permissões
CREATE POLICY "Collaborators can view their own permissions"
ON public.collaborator_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins da empresa podem gerenciar permissões de colaboradores da sua empresa
CREATE POLICY "Company admins can manage company collaborator permissions"
ON public.collaborator_permissions
FOR ALL
TO authenticated
USING (
  company_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'company_admin'
      AND user_roles.company_id = collaborator_permissions.company_id
  )
)
WITH CHECK (
  company_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'company_admin'
      AND user_roles.company_id = collaborator_permissions.company_id
  )
);

-- Clientes podem gerenciar permissões de seus colaboradores
CREATE POLICY "Clients can manage their collaborator permissions"
ON public.collaborator_permissions
FOR ALL
TO authenticated
USING (
  client_email IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'client'
      AND user_roles.client_email = collaborator_permissions.client_email
  )
)
WITH CHECK (
  client_email IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'client'
      AND user_roles.client_email = collaborator_permissions.client_email
  )
);

-- RLS Policies para collaborator_process_access

-- Usuários podem ver acessos de processos se podem ver as permissões pai
CREATE POLICY "Users can view process access if they can view permissions"
ON public.collaborator_process_access
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.collaborator_permissions cp
    WHERE cp.id = collaborator_process_access.permission_id
      AND (
        cp.user_id = auth.uid() OR
        (cp.company_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role = 'company_admin'
            AND user_roles.company_id = cp.company_id
        )) OR
        (cp.client_email IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role = 'client'
            AND user_roles.client_email = cp.client_email
        ))
      )
  )
);

-- Admins podem gerenciar acessos de processos
CREATE POLICY "Admins can manage process access"
ON public.collaborator_process_access
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.collaborator_permissions cp
    WHERE cp.id = collaborator_process_access.permission_id
      AND (
        (cp.company_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role = 'company_admin'
            AND user_roles.company_id = cp.company_id
        )) OR
        (cp.client_email IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role = 'client'
            AND user_roles.client_email = cp.client_email
        ))
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.collaborator_permissions cp
    WHERE cp.id = collaborator_process_access.permission_id
      AND (
        (cp.company_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role = 'company_admin'
            AND user_roles.company_id = cp.company_id
        )) OR
        (cp.client_email IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role = 'client'
            AND user_roles.client_email = cp.client_email
        ))
      )
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_collaborator_permissions_updated_at
  BEFORE UPDATE ON public.collaborator_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();