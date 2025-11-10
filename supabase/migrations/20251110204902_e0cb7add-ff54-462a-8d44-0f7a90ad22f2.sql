-- Permitir que clientes vejam os tipos de documentos da empresa dos processos que eles participam
CREATE POLICY "Clients can view document types from their processes"
  ON public.document_types FOR SELECT
  USING (
    company_id IN (
      SELECT DISTINCT p.company_id 
      FROM processes p
      WHERE p.client_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  );

-- Mesma regra para global_document_types (já era público mas vamos garantir)
DROP POLICY IF EXISTS "Users can view global document types" ON public.global_document_types;
CREATE POLICY "Everyone can view global document types"
  ON public.global_document_types FOR SELECT
  USING (true);