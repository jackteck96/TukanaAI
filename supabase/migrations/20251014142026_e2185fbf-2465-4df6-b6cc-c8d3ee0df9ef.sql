-- Remover a política antiga muito restritiva
DROP POLICY IF EXISTS "Clients and staff can create uploads" ON document_uploads;

-- Criar política que permite uploads autenticados normalmente
CREATE POLICY "Authenticated users can create uploads"
ON document_uploads
FOR INSERT
TO authenticated
WITH CHECK (can_access_process(process_id));

-- Criar política que permite uploads não autenticados via convite válido
CREATE POLICY "Unauthenticated clients can upload via valid invite"
ON document_uploads
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_invites ci
    JOIN processes p ON p.id = ci.process_id
    WHERE ci.status = 'pending'
    AND ci.expires_at > now()
    AND p.id = document_uploads.process_id
    AND p.client_email = document_uploads.client_email
  )
);