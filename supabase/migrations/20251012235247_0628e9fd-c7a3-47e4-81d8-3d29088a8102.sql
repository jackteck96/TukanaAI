-- Update function to also set process status to 'enviado' when any document is uploaded
CREATE OR REPLACE FUNCTION public.handle_new_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the related document request status and last upload info
  UPDATE public.document_requests
  SET current_status = 'enviado',
      last_upload_id = NEW.id,
      last_uploaded_at = now(),
      updated_at = now()
  WHERE id = NEW.document_request_id;

  -- Also mark the overall process as 'enviado' when the first file is uploaded (or any upload happens)
  UPDATE public.processes
  SET status = 'enviado',
      updated_at = now()
  WHERE id = NEW.process_id AND status IS DISTINCT FROM 'enviado';

  RETURN NEW;
END;
$$;

-- Create trigger to run after a document upload is inserted
DROP TRIGGER IF EXISTS trg_after_document_upload ON public.document_uploads;
CREATE TRIGGER trg_after_document_upload
AFTER INSERT ON public.document_uploads
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_document_upload();