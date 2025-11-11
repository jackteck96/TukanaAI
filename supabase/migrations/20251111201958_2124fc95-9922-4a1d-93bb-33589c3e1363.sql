-- Remover política antiga se existir
DROP POLICY IF EXISTS "Clients can create invites for their collaborators" ON public.user_invites;

-- Permitir que clientes criem convites para colaboradores
-- Um cliente pode criar um convite se:
-- 1. O client_email no convite corresponde ao email do cliente logado (eles estão convidando para sua própria área)
-- 2. O convite é para role 'staff' (colaborador de cliente)
CREATE POLICY "Clients can create invites for their collaborators"
ON public.user_invites
FOR INSERT
TO authenticated
WITH CHECK (
  -- Verificar se o usuário é um cliente
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('client', 'client_collaborator')
  )
  AND
  -- Verificar se o client_email corresponde ao email do cliente logado
  client_email IN (
    SELECT email FROM public.profiles
    WHERE id = auth.uid()
  )
  AND
  -- Garantir que é um convite para colaborador de cliente
  role = 'staff'
);

-- Permitir que clientes vejam os convites que eles criaram
DROP POLICY IF EXISTS "Clients can view their own invites" ON public.user_invites;

CREATE POLICY "Clients can view their own invites"
ON public.user_invites
FOR SELECT
TO authenticated
USING (
  -- Cliente pode ver convites que ele criou
  invited_by = auth.uid()
  OR
  -- Cliente pode ver convites onde ele é o client_email
  client_email IN (
    SELECT email FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Permitir que clientes cancelem (update) seus próprios convites
DROP POLICY IF EXISTS "Clients can cancel their own invites" ON public.user_invites;

CREATE POLICY "Clients can cancel their own invites"
ON public.user_invites
FOR UPDATE
TO authenticated
USING (
  invited_by = auth.uid()
  OR
  client_email IN (
    SELECT email FROM public.profiles
    WHERE id = auth.uid()
  )
);