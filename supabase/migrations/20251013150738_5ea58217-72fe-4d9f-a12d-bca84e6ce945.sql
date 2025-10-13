-- Ensure process status updates to 'enviado' when a document is uploaded
-- Create trigger to call existing function public.handle_new_document_upload

-- Safety: drop existing trigger if present
DROP TRIGGER IF EXISTS trg_after_document_upload ON public.document_uploads;

-- Create trigger after each insert on document_uploads
CREATE TRIGGER trg_after_document_upload
AFTER INSERT ON public.document_uploads
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_document_upload();