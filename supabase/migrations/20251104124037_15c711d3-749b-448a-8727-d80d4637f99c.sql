
-- Limpar relatórios antigos com formato incompatível
-- Isso forçará a regeneração de novos relatórios com o formato correto
DELETE FROM document_reports 
WHERE report_data::text LIKE '%analysis%' 
   OR report_data::text LIKE '%contractAnalysis%'
   OR report_data::text LIKE '%finalReport%';

-- Adicionar comentário para esclarecer o formato esperado
COMMENT ON COLUMN document_reports.report_data IS 
'Array JSON de documentos com campos: id, file_name, file_path, document_type, status, uploaded_by, created_at, updated_at, issue_date, expiration_date, issuing_location, file_size, file_type';
