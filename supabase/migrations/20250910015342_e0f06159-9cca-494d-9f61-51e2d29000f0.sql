-- Vamos temporariamente remover a política para diagnosticar o problema
DROP POLICY IF EXISTS "Authorized users can create processes" ON public.processes;

-- Criar uma política mais simples primeiro para testar
CREATE POLICY "Simple create processes policy" 
ON public.processes 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND created_by = auth.uid()
);