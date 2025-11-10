-- Adicionar campos de assinatura dual para documentos standalone
ALTER TABLE standalone_signature_documents 
ADD COLUMN IF NOT EXISTS company_signed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS client_signed_at timestamp with time zone;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_standalone_docs_company_id ON standalone_signature_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_standalone_docs_client_email ON standalone_signature_documents(client_email);
CREATE INDEX IF NOT EXISTS idx_standalone_docs_signature_status ON standalone_signature_documents(signature_status);