-- Criar tabela para documentos standalone para assinatura (não vinculados a processos)
CREATE TABLE IF NOT EXISTS public.standalone_signature_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  signature_deadline TIMESTAMP WITH TIME ZONE,
  signature_status TEXT NOT NULL DEFAULT 'pending',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_hash TEXT,
  notes TEXT
);

-- Habilitar RLS
ALTER TABLE public.standalone_signature_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Company staff can view their company documents"
ON public.standalone_signature_documents
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('company_admin', 'company_collaborator')
  )
);

CREATE POLICY "Company staff can insert documents"
ON public.standalone_signature_documents
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('company_admin', 'company_collaborator')
  )
);

CREATE POLICY "Company staff can update their company documents"
ON public.standalone_signature_documents
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('company_admin', 'company_collaborator')
  )
);

CREATE POLICY "Clients can view documents sent to them"
ON public.standalone_signature_documents
FOR SELECT
USING (
  client_email IN (
    SELECT email FROM public.profiles WHERE id = auth.uid()
  )
);

-- Índices para performance
CREATE INDEX idx_standalone_docs_company ON public.standalone_signature_documents(company_id);
CREATE INDEX idx_standalone_docs_client ON public.standalone_signature_documents(client_email);
CREATE INDEX idx_standalone_docs_status ON public.standalone_signature_documents(signature_status);

-- Trigger para updated_at
CREATE TRIGGER update_standalone_signature_documents_updated_at
BEFORE UPDATE ON public.standalone_signature_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();