-- Adicionar campos de permissões na tabela user_invites
ALTER TABLE public.user_invites 
ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'limited',
ADD COLUMN IF NOT EXISTS allowed_process_ids UUID[] DEFAULT '{}';

-- Adicionar constraint para garantir que access_type seja válido
ALTER TABLE public.user_invites 
ADD CONSTRAINT user_invites_access_type_check 
CHECK (access_type IN ('full', 'limited'));