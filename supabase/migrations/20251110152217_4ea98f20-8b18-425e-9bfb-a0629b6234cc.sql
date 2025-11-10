-- Remove políticas problemáticas que causam recursão infinita
DROP POLICY IF EXISTS "Company admins can view company user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Criar política correta usando função SECURITY DEFINER para evitar recursão
CREATE POLICY "Company admins can view company user roles"
ON public.user_roles
FOR SELECT
USING (
  company_id IS NOT NULL
  AND user_has_company_admin_role(auth.uid(), company_id)
);

-- Política para usuários verem seus próprios papéis
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (
  user_id = auth.uid()
);