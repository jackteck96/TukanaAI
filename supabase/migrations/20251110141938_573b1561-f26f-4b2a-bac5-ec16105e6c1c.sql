-- Allow company admins to SELECT user_roles for their company and clients to see their collaborators

-- Policy: Company admins can view company roles
CREATE POLICY "Company admins can view company roles"
ON public.user_roles
FOR SELECT
USING (
  (company_id IS NOT NULL)
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = user_roles.company_id
      AND ur.role = 'company_admin'::app_role
  )
);

-- Policy: Clients can view their collaborator roles
CREATE POLICY "Clients can view their collaborator roles"
ON public.user_roles
FOR SELECT
USING (
  (client_email IS NOT NULL)
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'client'::app_role
      AND ur.client_email = user_roles.client_email
  )
);