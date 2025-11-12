-- Adicionar política DELETE moderna usando user_roles
CREATE POLICY "Company staff can delete clients"
ON public.clients
FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  OR is_platform_admin(auth.uid())
);