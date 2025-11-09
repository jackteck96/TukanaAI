-- Adiciona política RLS para permitir que admins de empresa removam colaboradores
CREATE POLICY "Company admins can remove company collaborators"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  company_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.company_id = user_roles.company_id
    AND ur.role = 'company_admin'::app_role
  )
  AND user_id != auth.uid() -- Não pode remover a si mesmo
);