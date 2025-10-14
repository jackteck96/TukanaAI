-- Allow company staff to view document uploads for their company's processes
CREATE POLICY "Company staff can view uploads for their processes"
ON public.document_uploads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.processes p
    JOIN public.profiles pr ON pr.id = auth.uid()
    WHERE p.id = document_uploads.process_id
      AND p.company_id = pr.company_id
      AND pr.role IN ('admin', 'lawyer', 'staff')
  )
);