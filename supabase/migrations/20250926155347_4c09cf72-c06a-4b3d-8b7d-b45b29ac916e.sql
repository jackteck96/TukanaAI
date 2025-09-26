-- Adicionar novos campos à tabela ai_training_data para suportar exemplos de treinamento
ALTER TABLE public.ai_training_data 
ADD COLUMN input_example TEXT,
ADD COLUMN expected_output TEXT,
ADD COLUMN notes TEXT;

-- Criar comentário na tabela para explicar seu propósito
COMMENT ON TABLE public.ai_training_data IS 'Armazena exemplos de treinamento para a IA jurídica. Cada cliente deve ter instância isolada para compliance.';

-- Atualizar registros existentes com valores padrão
UPDATE public.ai_training_data 
SET input_example = COALESCE(conditions, 'Exemplo de entrada não definido'),
    expected_output = 'Saída esperada não definida',
    notes = 'Migrado automaticamente - requer atualização'
WHERE input_example IS NULL;