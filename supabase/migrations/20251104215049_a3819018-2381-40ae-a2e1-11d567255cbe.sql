-- Fix generate_document_report function to use correct column names
CREATE OR REPLACE FUNCTION public.generate_document_report(process_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    report_id UUID;
    process_company_id UUID;
    doc_data JSONB;
    total_docs INTEGER;
    pending_docs INTEGER;
    approved_docs INTEGER;
BEGIN
    SELECT company_id INTO process_company_id
    FROM processes 
    WHERE id = process_uuid;
    
    IF process_company_id IS NULL THEN
        RAISE EXCEPTION 'Processo não encontrado';
    END IF;
    
    IF NOT can_access_process(process_uuid) THEN
        RAISE EXCEPTION 'Acesso negado ao processo';
    END IF;
    
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
                'issue_date', d.issue_date,
                'expiration_date', d.expiration_date,
                'issuing_location', d.issuing_location,
                'file_size', d.file_size,
                'file_type', d.file_type,
                'has_validity_date', COALESCE(dt.has_issue_date, false),
                'has_expiration_date', COALESCE(dt.has_expiration_date, false),
                'requires_issuing_location', COALESCE(dt.requires_issuing_location, false)
            )
        ), '[]'::json) INTO doc_data
    FROM documents d
    LEFT JOIN document_types dt ON dt.name = d.document_type AND dt.company_id = d.company_id
    WHERE d.process_id = process_uuid;
    
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'Pendente'),
        COUNT(*) FILTER (WHERE status = 'Aprovado')
    INTO total_docs, pending_docs, approved_docs
    FROM documents
    WHERE process_id = process_uuid;
    
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
$function$;