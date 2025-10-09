-- Adicionar campo auth_report_url à tabela internal_signatures
ALTER TABLE public.internal_signatures 
ADD COLUMN IF NOT EXISTS auth_report_url text;

-- Criar índice para busca por signature_hash
CREATE INDEX IF NOT EXISTS idx_internal_signatures_signature_hash 
ON public.internal_signatures(signature_hash);

-- Comentários
COMMENT ON COLUMN public.internal_signatures.auth_report_url IS 'URL do PDF do termo de autenticidade da assinatura';