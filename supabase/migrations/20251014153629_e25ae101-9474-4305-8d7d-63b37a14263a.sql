-- Allow company staff to view documents in storage for their processes
CREATE POLICY "Company staff can view process documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1
    FROM public.documents d
    JOIN public.processes p ON p.id = d.process_id
    JOIN public.profiles pr ON pr.id = auth.uid()
    WHERE d.file_path = storage.objects.name
      AND p.company_id = pr.company_id
      AND pr.role IN ('admin', 'lawyer', 'staff')
  )
);

-- Allow clients to view their own uploaded documents
CREATE POLICY "Clients can view their process documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1
    FROM public.processes p
    JOIN public.profiles pr ON pr.id = auth.uid()
    WHERE storage.objects.name LIKE p.id::text || '%'
      AND p.client_email = pr.email
  )
);