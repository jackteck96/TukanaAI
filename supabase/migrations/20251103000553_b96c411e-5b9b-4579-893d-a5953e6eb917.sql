-- Adicionar campos de status aos documentos do sócio
ALTER TABLE public.partner_documents
ADD COLUMN IF NOT EXISTS social_contract_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rg_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS cpf_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS address_proof_status TEXT DEFAULT 'pending';

-- Criar tabela de histórico de documentos
CREATE TABLE IF NOT EXISTS public.partner_documents_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_document_id UUID NOT NULL REFERENCES public.partner_documents(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'social_contract', 'rg', 'cpf', 'address_proof'
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  replaced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  replaced_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para melhor performance
CREATE INDEX IF NOT EXISTS idx_partner_documents_history_partner_id 
ON public.partner_documents_history(partner_document_id);

CREATE INDEX IF NOT EXISTS idx_partner_documents_history_document_type 
ON public.partner_documents_history(document_type);

-- Enable RLS
ALTER TABLE public.partner_documents_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can view their own document history
CREATE POLICY "Clients can view their own document history"
ON public.partner_documents_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partner_documents pd
    WHERE pd.id = partner_documents_history.partner_document_id
    AND pd.client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);

-- RLS Policy: System can insert history records
CREATE POLICY "System can insert history records"
ON public.partner_documents_history
FOR INSERT
WITH CHECK (true);

-- RLS Policy: Company staff can view history of their clients
CREATE POLICY "Company staff can view client document history"
ON public.partner_documents_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partner_documents pd
    WHERE pd.id = partner_documents_history.partner_document_id
    AND pd.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
    AND get_current_user_role() IN ('admin', 'lawyer', 'staff')
  )
);

-- Função para mover documento atual para histórico antes de atualizar
CREATE OR REPLACE FUNCTION public.archive_partner_document()
RETURNS TRIGGER AS $$
BEGIN
  -- Social Contract
  IF NEW.social_contract_path IS DISTINCT FROM OLD.social_contract_path 
     AND OLD.social_contract_path IS NOT NULL THEN
    INSERT INTO public.partner_documents_history (
      partner_document_id, document_type, file_path, uploaded_at, replaced_by
    ) VALUES (
      OLD.id, 'social_contract', OLD.social_contract_path, 
      OLD.social_contract_uploaded_at, auth.uid()
    );
  END IF;
  
  -- RG
  IF NEW.rg_path IS DISTINCT FROM OLD.rg_path 
     AND OLD.rg_path IS NOT NULL THEN
    INSERT INTO public.partner_documents_history (
      partner_document_id, document_type, file_path, uploaded_at, replaced_by
    ) VALUES (
      OLD.id, 'rg', OLD.rg_path, OLD.rg_uploaded_at, auth.uid()
    );
  END IF;
  
  -- CPF
  IF NEW.cpf_path IS DISTINCT FROM OLD.cpf_path 
     AND OLD.cpf_path IS NOT NULL THEN
    INSERT INTO public.partner_documents_history (
      partner_document_id, document_type, file_path, uploaded_at, replaced_by
    ) VALUES (
      OLD.id, 'cpf', OLD.cpf_path, OLD.cpf_uploaded_at, auth.uid()
    );
  END IF;
  
  -- Address Proof
  IF NEW.address_proof_path IS DISTINCT FROM OLD.address_proof_path 
     AND OLD.address_proof_path IS NOT NULL THEN
    INSERT INTO public.partner_documents_history (
      partner_document_id, document_type, file_path, uploaded_at, replaced_by
    ) VALUES (
      OLD.id, 'address_proof', OLD.address_proof_path, 
      OLD.address_proof_uploaded_at, auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para arquivar documentos automaticamente
DROP TRIGGER IF EXISTS archive_partner_document_trigger ON public.partner_documents;
CREATE TRIGGER archive_partner_document_trigger
BEFORE UPDATE ON public.partner_documents
FOR EACH ROW
EXECUTE FUNCTION public.archive_partner_document();

COMMENT ON TABLE public.partner_documents_history IS 'Histórico de versões anteriores dos documentos do sócio administrador';
COMMENT ON FUNCTION public.archive_partner_document() IS 'Move documento atual para histórico antes de atualizar com nova versão';