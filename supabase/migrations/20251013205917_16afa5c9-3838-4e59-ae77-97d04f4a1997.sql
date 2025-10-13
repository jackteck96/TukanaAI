-- Adicionar política RLS para permitir que usuários deletem processos de sua empresa
CREATE POLICY "Users can delete processes from their company"
ON public.processes
FOR DELETE
USING (
  can_access_process(id) AND 
  (company_id IN ( 
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  ))
);