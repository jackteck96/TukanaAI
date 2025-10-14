-- Allow authenticated clients to upload to document_uploads for their own processes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'document_uploads' 
      AND policyname = 'Clients can create uploads for their processes'
  ) THEN
    EXECUTE 'DROP POLICY "Clients can create uploads for their processes" ON public.document_uploads';
  END IF;
END$$;

CREATE POLICY "Clients can create uploads for their processes"
ON public.document_uploads
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.processes p
    JOIN public.profiles pr ON pr.id = auth.uid()
    WHERE p.id = document_uploads.process_id
      AND p.client_email = pr.email
  )
);

-- Optional: ensure policy order doesn't block anon invite flow
-- (no-op since Postgres evaluates all applicable policies with OR semantics for INSERT)
