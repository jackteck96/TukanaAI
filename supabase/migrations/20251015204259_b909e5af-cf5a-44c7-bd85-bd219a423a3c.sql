-- Adicionar campo requires_signature em documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS requires_signature BOOLEAN DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'not_required';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS company_signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS client_signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS authenticity_term_url TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_documents_signature_status ON public.documents(signature_status);
CREATE INDEX IF NOT EXISTS idx_documents_requires_signature ON public.documents(requires_signature);

-- Comentários explicativos
COMMENT ON COLUMN public.documents.requires_signature IS 'Indica se o documento requer assinatura';
COMMENT ON COLUMN public.documents.signature_status IS 'Status: not_required, pending_client, pending_company, partially_signed, fully_signed';
COMMENT ON COLUMN public.documents.company_signed_at IS 'Data/hora da assinatura da empresa';
COMMENT ON COLUMN public.documents.client_signed_at IS 'Data/hora da assinatura do cliente';
COMMENT ON COLUMN public.documents.authenticity_term_url IS 'URL do termo de autenticidade final';