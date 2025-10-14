-- Mirror document_uploads into documents so the company views existing UI
CREATE OR REPLACE FUNCTION public.mirror_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_name text;
  proc_company uuid;
  proc_client_name text;
  proc_client_email text;
  file_name text;
BEGIN
  SELECT document_name INTO doc_name FROM public.document_requests WHERE id = NEW.document_request_id;
  SELECT company_id, client_name, client_email
    INTO proc_company, proc_client_name, proc_client_email
  FROM public.processes WHERE id = NEW.process_id;

  file_name := split_part(NEW.file_path, '/', -1);

  INSERT INTO public.documents (
    process_id, company_id, file_size, file_name, file_path, file_type, document_type, uploaded_by, status
  ) VALUES (
    NEW.process_id,
    proc_company,
    COALESCE(NEW.file_size, 0),
    file_name,
    NEW.file_path,
    COALESCE(NEW.file_type, 'application/octet-stream'),
    COALESCE(doc_name, 'Documento'),
    COALESCE(proc_client_name, proc_client_email, 'Cliente'),
    'Pendente'
  );

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_mirror_document_upload ON public.document_uploads;
CREATE TRIGGER trg_mirror_document_upload
AFTER INSERT ON public.document_uploads
FOR EACH ROW EXECUTE FUNCTION public.mirror_document_upload();

-- One-time backfill of existing uploads not yet in documents
INSERT INTO public.documents (
  process_id, company_id, file_size, file_name, file_path, file_type, document_type, uploaded_by, status
)
SELECT 
  du.process_id,
  p.company_id,
  COALESCE(du.file_size, 0),
  split_part(du.file_path, '/', -1) AS file_name,
  du.file_path,
  COALESCE(du.file_type, 'application/octet-stream'),
  COALESCE(dr.document_name, 'Documento') AS document_type,
  COALESCE(p.client_name, p.client_email, 'Cliente') AS uploaded_by,
  'Pendente'
FROM public.document_uploads du
JOIN public.processes p ON p.id = du.process_id
LEFT JOIN public.document_requests dr ON dr.id = du.document_request_id
LEFT JOIN public.documents d ON d.file_path = du.file_path
WHERE d.id IS NULL;