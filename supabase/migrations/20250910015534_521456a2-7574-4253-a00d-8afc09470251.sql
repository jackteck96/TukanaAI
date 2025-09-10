-- Agora vamos reabilitar o RLS com uma política que definitivamente funciona
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

-- Remover a política antiga
DROP POLICY IF EXISTS "Simple create processes policy" ON public.processes;

-- Criar uma política muito simples que permite apenas inserção para usuários autenticados
CREATE POLICY "Allow authenticated users to create processes" 
ON public.processes 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Criar política para leitura baseada na empresa
CREATE POLICY "Users can view their company processes" 
ON public.processes 
FOR SELECT 
TO authenticated
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Criar política para atualização baseada na empresa
CREATE POLICY "Users can update their company processes" 
ON public.processes 
FOR UPDATE 
TO authenticated
USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));