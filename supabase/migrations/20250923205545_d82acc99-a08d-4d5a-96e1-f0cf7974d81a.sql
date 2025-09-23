-- Criar função RPC para gerar relatórios de documentos com RLS correto
CREATE OR REPLACE FUNCTION generate_document_report(process_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
    
    -- Buscar todos os documentos do processo
    SELECT 
        COALESCE(json_agg(
            json_build_object(
                'id', d.id,
                'file_name', d.file_name,
                'file_path', d.file_path,
                'document_type', d.document_type,
                'status', d.status,
                'uploaded_by', d.uploaded_by,
                'created_at', d.created_at
            )
        ), '[]'::json) INTO doc_data
    FROM documents d
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