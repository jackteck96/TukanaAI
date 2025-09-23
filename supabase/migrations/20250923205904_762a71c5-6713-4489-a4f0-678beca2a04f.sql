-- Adicionar campos para datas de validade e expiração nos documentos
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS validity_date DATE,
ADD COLUMN IF NOT EXISTS expiration_date DATE,
ADD COLUMN IF NOT EXISTS issuing_location TEXT;

-- Atualizar a função RPC para incluir informações detalhadas dos documentos
CREATE OR REPLACE FUNCTION generate_document_report(process_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    report_id UUID;
    process_company_id UUID;
    doc_data JSONB;
    total_docs INTEGER;
    pending_docs INTEGER;
    approved_docs INTEGER;
BEGIN
    -- Verificar se o processo existe e pegar o company_id
    SELECT company_id INTO process_company_id
    FROM processes 
    WHERE id = process_uuid;
    
    IF process_company_id IS NULL THEN
        RAISE EXCEPTION 'Processo não encontrado';
    END IF;
    
    -- Verificar se o usuário tem acesso ao processo
    IF NOT can_access_process(process_uuid) THEN
        RAISE EXCEPTION 'Acesso negado ao processo';
    END IF;
    
    -- Buscar todos os documentos do processo com informações detalhadas
    SELECT 
        COALESCE(json_agg(
            json_build_object(
                'id', d.id,
                'file_name', d.file_name,
                'file_path', d.file_path,
                'document_type', d.document_type,
                'status', d.status,
                'uploaded_by', d.uploaded_by,
                'created_at', d.created_at,
                'updated_at', d.updated_at,
                'validity_date', d.validity_date,
                'expiration_date', d.expiration_date,
                'issuing_location', d.issuing_location,
                'file_size', d.file_size,
                'file_type', d.file_type,
                'has_validity_date', COALESCE(dt.has_validity_date, false),
                'has_expiration_date', COALESCE(dt.has_expiration_date, false),
                'requires_issuing_location', COALESCE(dt.requires_issuing_location, false)
            )
        ), '[]'::json) INTO doc_data
    FROM documents d
    LEFT JOIN document_types dt ON dt.name = d.document_type AND dt.company_id = d.company_id
    WHERE d.process_id = process_uuid;
    
    -- Calcular estatísticas
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'Pendente'),
        COUNT(*) FILTER (WHERE status = 'Aprovado')
    INTO total_docs, pending_docs, approved_docs
    FROM documents
    WHERE process_id = process_uuid;
    
    -- Inserir o relatório
    INSERT INTO document_reports (
        process_id,
        company_id,
        report_data,
        total_documents,
        pending_documents,
        approved_documents
    ) VALUES (
        process_uuid,
        process_company_id,
        doc_data::jsonb,
        total_docs,
        pending_docs,
        approved_docs
    ) RETURNING id INTO report_id;
    
    RETURN report_id;
END;
$$;