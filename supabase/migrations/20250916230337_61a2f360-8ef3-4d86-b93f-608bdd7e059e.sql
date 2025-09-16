-- Fix RLS so clients only see their own processes
-- Drop overly broad policies and recreate them restricted to staff roles

DROP POLICY IF EXISTS "Users can view their company processes" ON public.processes;
CREATE POLICY "Staff can view their company processes"
ON public.processes
FOR SELECT
USING (
  public.get_current_user_role() IN ('admin','lawyer','staff')
  AND company_id IN (
    SELECT profiles.company_id FROM public.profiles WHERE profiles.id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their company processes" ON public.processes;
CREATE POLICY "Staff can update their company processes"
ON public.processes
FOR UPDATE
USING (
  public.get_current_user_role() IN ('admin','lawyer','staff')
  AND company_id IN (
    SELECT profiles.company_id FROM public.profiles WHERE profiles.id = auth.uid()
  )
)
WITH CHECK (
  public.get_current_user_role() IN ('admin','lawyer','staff')
  AND company_id IN (
    SELECT profiles.company_id FROM public.profiles WHERE profiles.id = auth.uid()
  )
);

-- Keep existing policy "Users can view authorized processes" which uses can_access_process()
-- This allows clients to see only their own processes (client_email = user email)
-- No changes needed to that policy.