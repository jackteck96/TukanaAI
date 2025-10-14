-- Adicionar política para permitir que clientes não autenticados (via convite) façam upload
CREATE POLICY "Allow unauthenticated uploads via invite"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (auth.uid() IS NOT NULL OR 
   EXISTS (
     SELECT 1 FROM client_invites
     WHERE status = 'pending'
     AND expires_at > now()
     AND process_id::text = (storage.foldername(name))[1]
   ))
);

-- Permitir leitura para todos os arquivos de processos que o usuário tem acesso
CREATE POLICY "Allow authenticated users to read their process documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' AND
  (
    -- Usuários autenticados podem ver documentos de processos que eles têm acesso
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM processes p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND (
        can_access_process(p.id) OR
        p.client_email = (SELECT email FROM profiles WHERE id = auth.uid())
      )
    )
  )
);