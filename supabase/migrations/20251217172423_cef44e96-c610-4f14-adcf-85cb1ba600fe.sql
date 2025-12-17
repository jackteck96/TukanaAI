-- Allow company staff to delete documents from their company
CREATE POLICY "Company staff can delete documents"
ON public.documents
FOR DELETE
USING (
  company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.company_id = documents.company_id
    AND user_roles.role IN ('company_admin', 'company_collaborator')
  )
);