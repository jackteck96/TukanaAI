-- Limpar todos os processos fictícios/incorretos
DELETE FROM public.processes WHERE company_id = 'd2e9d840-a906-4472-aeda-3b9117cec1cf';

-- Adicionar coluna para nome do projeto na tabela processes
ALTER TABLE public.processes ADD COLUMN IF NOT EXISTS project_name TEXT;