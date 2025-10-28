-- Renomear coluna validity_date para issue_date na tabela documents
ALTER TABLE public.documents 
RENAME COLUMN validity_date TO issue_date;

-- Renomear coluna has_validity_date para has_issue_date na tabela document_types
ALTER TABLE public.document_types 
RENAME COLUMN has_validity_date TO has_issue_date;

-- Renomear coluna has_validity_date para has_issue_date na tabela global_document_types
ALTER TABLE public.global_document_types 
RENAME COLUMN has_validity_date TO has_issue_date;

-- Adicionar comentários para clarificar as colunas
COMMENT ON COLUMN public.documents.issue_date IS 'Data de emissão do documento';
COMMENT ON COLUMN public.documents.expiration_date IS 'Data de expiração/vencimento do documento';
COMMENT ON COLUMN public.document_types.has_issue_date IS 'Indica se o tipo de documento possui data de emissão';
COMMENT ON COLUMN public.global_document_types.has_issue_date IS 'Indica se o tipo de documento possui data de emissão';

-- Criar função para verificar documentos vencidos ou próximos do vencimento
CREATE OR REPLACE FUNCTION public.check_expiring_documents(
  days_ahead integer DEFAULT 30
)
RETURNS TABLE (
  document_id uuid,
  document_name text,
  document_type text,
  expiration_date date,
  days_until_expiration integer,
  process_id uuid,
  client_name text,
  client_email text,
  company_id uuid,
  status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as document_id,
    d.file_name as document_name,
    d.document_type,
    d.expiration_date,
    (d.expiration_date - CURRENT_DATE)::integer as days_until_expiration,
    p.id as process_id,
    p.client_name,
    p.client_email,
    p.company_id,
    CASE 
      WHEN d.expiration_date < CURRENT_DATE THEN 'expired'
      WHEN d.expiration_date <= CURRENT_DATE + days_ahead THEN 'expiring_soon'
      ELSE 'valid'
    END as status
  FROM public.documents d
  INNER JOIN public.processes p ON d.process_id = p.id
  WHERE 
    d.expiration_date IS NOT NULL
    AND d.expiration_date <= CURRENT_DATE + days_ahead
    AND d.status = 'Aprovado'
  ORDER BY d.expiration_date ASC;
END;
$$;

-- Garantir permissões para a função
GRANT EXECUTE ON FUNCTION public.check_expiring_documents(integer) TO authenticated;