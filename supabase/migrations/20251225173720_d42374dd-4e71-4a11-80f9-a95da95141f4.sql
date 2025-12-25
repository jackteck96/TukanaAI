-- Adicionar colunas para configuração de documentos personalizados
ALTER TABLE document_requests 
ADD COLUMN IF NOT EXISTS has_issue_date BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_expiration_date BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_issuing_location BOOLEAN DEFAULT false;