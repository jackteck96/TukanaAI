-- Permitir que colaboradores visualizem processos sem depender de profiles.company_id
-- Nova política baseada apenas na função can_access_process(id)

DO $$
BEGIN
  -- Remover política antiga redundante se existir (não obrigatório, mas evita confusão)
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'processes' 
      AND policyname = 'Users can view processes via access function'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view processes via access function" ON public.processes';
  END IF;
END $$;

CREATE POLICY "Users can view processes via access function"
ON public.processes
FOR SELECT
USING (can_access_process(id));