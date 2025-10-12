-- Permitir que clientes vejam as empresas dos seus processos
CREATE POLICY "Clients can view companies from their processes"
ON public.companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.processes
    WHERE processes.company_id = companies.id
    AND processes.client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);

-- Permitir que clientes vejam document_requests dos seus processos
CREATE POLICY "Clients can view document requests from their processes"
ON public.document_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.processes
    WHERE processes.id = document_requests.process_id
    AND processes.client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);

-- Garantir que clients podem ver os uploads de documentos
CREATE POLICY "Clients can view document uploads from their processes"
ON public.document_uploads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.processes
    WHERE processes.id = document_uploads.process_id
    AND processes.client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);