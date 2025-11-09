-- Adicionar campo client_email para suportar convites de colaboradores de clientes
ALTER TABLE public.user_invites 
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Alterar company_id para ser nullable (para permitir convites de colaboradores de cliente)
ALTER TABLE public.user_invites 
ALTER COLUMN company_id DROP NOT NULL;

-- Adicionar constraint para garantir que ou company_id ou client_email esteja preenchido
ALTER TABLE public.user_invites 
ADD CONSTRAINT user_invites_context_check 
CHECK (
  (company_id IS NOT NULL AND client_email IS NULL) OR
  (company_id IS NULL AND client_email IS NOT NULL)
);