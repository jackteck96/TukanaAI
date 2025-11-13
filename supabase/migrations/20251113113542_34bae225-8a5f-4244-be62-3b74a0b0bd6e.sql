-- Allow clients to insert their own standalone signature documents
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'standalone_signature_documents' AND policyname = 'Clients can insert their own standalone signature docs'
  ) THEN
    CREATE POLICY "Clients can insert their own standalone signature docs"
    ON public.standalone_signature_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
      (
        public.get_current_user_role() = 'client'::user_role
        AND client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
      ) OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'client_collaborator'::app_role
          AND ur.client_email = standalone_signature_documents.client_email
      )
    );
  END IF;
END $$;

-- Storage policy to allow clients to upload standalone signature files under their company folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Clients can upload standalone signature files'
  ) THEN
    CREATE POLICY "Clients can upload standalone signature files"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'documents'
      AND (storage.foldername(name))[1] = 'standalone-signatures'
      AND (storage.foldername(name))[2] = (SELECT company_id::text FROM public.profiles WHERE id = auth.uid())
    );
  END IF;
END $$;
