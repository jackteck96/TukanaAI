-- Fix RLS policies for document_reports to allow collaborators to view reports

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view reports for authorized processes" ON public.document_reports;

-- Create new policy that allows collaborators with process access
CREATE POLICY "Users can view reports for authorized processes"
ON public.document_reports
FOR SELECT
USING (
  can_access_process(process_id)
);

-- Ensure collaborators can also see reports via direct permission check
CREATE POLICY "Collaborators can view reports for accessible processes"
ON public.document_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM collaborator_permissions cp
    JOIN collaborator_process_access cpa ON cp.id = cpa.permission_id
    WHERE cpa.process_id = document_reports.process_id
    AND cp.user_id = auth.uid()
  )
);