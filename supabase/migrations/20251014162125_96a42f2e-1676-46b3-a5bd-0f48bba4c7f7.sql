-- Adicionar colunas para armazenar observações da empresa sobre os documentos
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS adjustment_comments TEXT;