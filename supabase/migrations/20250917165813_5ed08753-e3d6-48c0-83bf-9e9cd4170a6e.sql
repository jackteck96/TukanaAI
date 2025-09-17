-- Policies to enable clients to access their processes and upload/view documents without requiring company match

-- 1) Allow clients to view their own processes by email
CREATE POLICY "Clients can view their processes by email"
ON public.processes
FOR SELECT
USING (
  public.get_current_user_role() = 'client'::user_role
  AND client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- 2) Allow clients to view documents for their processes
CREATE POLICY "Clients can view documents for their processes"
ON public.documents
FOR SELECT
USING (
  public.get_current_user_role() = 'client'::user_role
  AND EXISTS (
    SELECT 1 FROM public.processes p
    WHERE p.id = documents.process_id
      AND p.client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);

-- 3) Allow clients to insert documents for their processes
CREATE POLICY "Clients can insert documents for their processes"
ON public.documents
FOR INSERT
WITH CHECK (
  public.get_current_user_role() = 'client'::user_role
  AND EXISTS (
    SELECT 1 FROM public.processes p
    WHERE p.id = documents.process_id
      AND p.client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);

-- 4) Allow clients to view document reports for their processes
CREATE POLICY "Clients can view reports for their processes"
ON public.document_reports
FOR SELECT
USING (
  public.get_current_user_role() = 'client'::user_role
  AND EXISTS (
    SELECT 1 FROM public.processes p
    WHERE p.id = document_reports.process_id
      AND p.client_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);
