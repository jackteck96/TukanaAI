-- Primeiro, vamos verificar se a função get_current_user_role está funcionando corretamente
-- e verificar as políticas da tabela processes

-- Recriar a política para permitir que staff crie processos
DROP POLICY IF EXISTS "Authorized users can create processes" ON public.processes;

CREATE POLICY "Authorized users can create processes" 
ON public.processes 
FOR INSERT 
WITH CHECK (
  (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = ANY (ARRAY['admin'::user_role, 'lawyer'::user_role, 'staff'::user_role])
  AND 
  company_id = (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);