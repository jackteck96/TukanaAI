-- 1) Document requests and uploads schema + secure policies

-- Table: document_requests (solicitações)
CREATE TABLE IF NOT EXISTS public.document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  document_name text NOT NULL,
  instructions text,
  required boolean NOT NULL DEFAULT true,
  current_status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: document_uploads (envios de documentos)
CREATE TABLE IF NOT EXISTS public.document_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  document_request_id uuid NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  client_id uuid,
  client_email text,
  file_path text NOT NULL,
  file_size integer,
  file_type text,
  status text NOT NULL DEFAULT 'enviado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add linkage on requests to latest upload
ALTER TABLE public.document_requests
  ADD COLUMN IF NOT EXISTS last_upload_id uuid NULL REFERENCES public.document_uploads(id),
  ADD COLUMN IF NOT EXISTS last_uploaded_at timestamptz NULL;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_document_requests_process ON public.document_requests(process_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_process_request ON public.document_uploads(process_id, document_request_id);

-- Enable RLS
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;

-- Policies for document_requests
DO $$
BEGIN
  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='document_requests' AND policyname='Users can view requests for authorized processes'
  ) THEN
    CREATE POLICY "Users can view requests for authorized processes"
    ON public.document_requests
    FOR SELECT
    USING (
      can_access_process(process_id)
      AND company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );
  END IF;

  -- INSERT (staff only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='document_requests' AND policyname='Company staff can insert requests'
  ) THEN
    CREATE POLICY "Company staff can insert requests"
    ON public.document_requests
    FOR INSERT TO authenticated
    WITH CHECK (
      get_current_user_role() IN ('admin','lawyer','staff')
      AND company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );
  END IF;

  -- UPDATE (staff only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='document_requests' AND policyname='Company staff can update requests'
  ) THEN
    CREATE POLICY "Company staff can update requests"
    ON public.document_requests
    FOR UPDATE TO authenticated
    USING (
      get_current_user_role() IN ('admin','lawyer','staff')
      AND company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    )
    WITH CHECK (
      get_current_user_role() IN ('admin','lawyer','staff')
      AND company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    );
  END IF;
END $$;

-- Policies for document_uploads
DO $$
BEGIN
  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='document_uploads' AND policyname='Users can view uploads for authorized processes'
  ) THEN
    CREATE POLICY "Users can view uploads for authorized processes"
    ON public.document_uploads
    FOR SELECT
    USING (
      can_access_process(process_id)
    );
  END IF;

  -- INSERT (clients and staff)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='document_uploads' AND policyname='Clients and staff can create uploads'
  ) THEN
    CREATE POLICY "Clients and staff can create uploads"
    ON public.document_uploads
    FOR INSERT TO authenticated
    WITH CHECK (
      can_access_process(process_id)
    );
  END IF;

  -- UPDATE (staff only)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='document_uploads' AND policyname='Company staff can update uploads'
  ) THEN
    CREATE POLICY "Company staff can update uploads"
    ON public.document_uploads
    FOR UPDATE TO authenticated
    USING (
      get_current_user_role() IN ('admin','lawyer','staff') AND can_access_process(process_id)
    )
    WITH CHECK (
      get_current_user_role() IN ('admin','lawyer','staff') AND can_access_process(process_id)
    );
  END IF;
END $$;

-- Triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_document_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_document_requests_updated_at
    BEFORE UPDATE ON public.document_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_document_uploads_updated_at'
  ) THEN
    CREATE TRIGGER update_document_uploads_updated_at
    BEFORE UPDATE ON public.document_uploads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger to mark request as enviado whenever a new upload is inserted
CREATE OR REPLACE FUNCTION public.handle_new_document_upload()
RETURNS trigger AS $$
BEGIN
  UPDATE public.document_requests
  SET current_status = 'enviado',
      last_upload_id = NEW.id,
      last_uploaded_at = now(),
      updated_at = now()
  WHERE id = NEW.document_request_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'after_document_upload_insert'
  ) THEN
    CREATE TRIGGER after_document_upload_insert
    AFTER INSERT ON public.document_uploads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_document_upload();
  END IF;
END $$;

-- Optional compatibility view so code can read from `invitations` name if needed
CREATE OR REPLACE VIEW public.invitations AS
SELECT 
  id,
  token,
  email,
  company_id,
  process_id,
  expires_at,
  used_at,
  status,
  invited_by,
  created_at
FROM public.client_invites;