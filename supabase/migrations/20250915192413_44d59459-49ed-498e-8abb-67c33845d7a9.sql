-- Corrigir search_path das funções para evitar problemas de segurança
CREATE OR REPLACE FUNCTION public.generate_signature_hash(
  document_uuid UUID,
  signer_uuid UUID,
  timestamp_val TIMESTAMP WITH TIME ZONE
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    digest(
      document_uuid::text || 
      signer_uuid::text || 
      extract(epoch from timestamp_val)::text || 
      'internal_signature_salt',
      'sha256'
    ),
    'hex'
  );
END;
$$;

-- Corrigir função de hash do documento
CREATE OR REPLACE FUNCTION public.generate_document_hash(
  document_uuid UUID,
  file_path_val TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    digest(
      document_uuid::text || 
      file_path_val || 
      'document_integrity_salt',
      'sha256'
    ),
    'hex'
  );
END;
$$;