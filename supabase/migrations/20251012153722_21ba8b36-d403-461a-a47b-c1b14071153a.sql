-- Add missing foreign keys to enable embedded relations and ensure referential integrity

-- 1) processes.company_id -> companies.id (nullable, set null on delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'processes' AND c.conname = 'processes_company_id_fkey'
  ) THEN
    ALTER TABLE public.processes
    ADD CONSTRAINT processes_company_id_fkey
    FOREIGN KEY (company_id)
    REFERENCES public.companies(id)
    ON DELETE SET NULL;
  END IF;
END$$;

-- 2) document_requests.process_id -> processes.id (cascade delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'document_requests' AND c.conname = 'document_requests_process_id_fkey'
  ) THEN
    ALTER TABLE public.document_requests
    ADD CONSTRAINT document_requests_process_id_fkey
    FOREIGN KEY (process_id)
    REFERENCES public.processes(id)
    ON DELETE CASCADE;
  END IF;
END$$;

-- 3) document_uploads.document_request_id -> document_requests.id (cascade delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'document_uploads' AND c.conname = 'document_uploads_document_request_id_fkey'
  ) THEN
    ALTER TABLE public.document_uploads
    ADD CONSTRAINT document_uploads_document_request_id_fkey
    FOREIGN KEY (document_request_id)
    REFERENCES public.document_requests(id)
    ON DELETE CASCADE;
  END IF;
END$$;

-- 4) document_uploads.process_id -> processes.id (cascade delete) [optional but useful]
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'document_uploads' AND c.conname = 'document_uploads_process_id_fkey'
  ) THEN
    ALTER TABLE public.document_uploads
    ADD CONSTRAINT document_uploads_process_id_fkey
    FOREIGN KEY (process_id)
    REFERENCES public.processes(id)
    ON DELETE CASCADE;
  END IF;
END$$;
