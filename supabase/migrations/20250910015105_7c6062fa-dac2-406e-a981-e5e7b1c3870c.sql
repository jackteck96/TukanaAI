-- Vamos corrigir a política RLS usando uma abordagem mais simples e direta
DROP POLICY IF EXISTS "Authorized users can create processes" ON public.processes;

-- Criar política mais simples que não depende de funções complexas
CREATE POLICY "Authorized users can create processes" 
ON public.processes 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by 
  AND 
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'lawyer', 'staff')
);