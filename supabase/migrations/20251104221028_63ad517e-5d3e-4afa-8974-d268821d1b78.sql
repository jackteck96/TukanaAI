-- Remover políticas antigas e recriar com permissões corretas

DROP POLICY IF EXISTS "Clients can view their process documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can download authorized documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;

-- Política unificada para visualizar e baixar documentos
CREATE POLICY "Users can access documents from their processes"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' 
  AND (
    -- Cliente tem acesso via email do processo
    EXISTS (
      SELECT 1 FROM public.processes p
      WHERE (storage.foldername(name))[1] = p.id::text
        AND p.client_email = (
          SELECT email FROM public.profiles WHERE id = auth.uid()
        )
    )
    OR
    -- Usuário pertence à empresa do processo
    EXISTS (
      SELECT 1 FROM public.processes p
      INNER JOIN public.profiles prof ON prof.company_id = p.company_id
      WHERE (storage.foldername(name))[1] = p.id::text
        AND prof.id = auth.uid()
    )
    OR
    -- Role de company_admin/collaborator
    EXISTS (
      SELECT 1 FROM public.processes p
      INNER JOIN public.user_roles ur ON ur.company_id = p.company_id
      WHERE (storage.foldername(name))[1] = p.id::text
        AND ur.user_id = auth.uid()
        AND ur.role IN ('company_admin', 'company_collaborator')
    )
    OR
    -- Admins da plataforma
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);