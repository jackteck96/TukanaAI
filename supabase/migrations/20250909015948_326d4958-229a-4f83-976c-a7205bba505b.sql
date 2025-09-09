-- Criar tabela para gerenciar convites de clientes
CREATE TABLE public.client_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL,
  process_id UUID NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'used', 'expired'))
);

-- Habilitar RLS
ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view invites from their company" 
ON public.client_invites 
FOR SELECT 
USING (company_id IN (
  SELECT profiles.company_id 
  FROM profiles 
  WHERE profiles.id = auth.uid()
));

CREATE POLICY "Authorized users can create invites" 
ON public.client_invites 
FOR INSERT 
WITH CHECK (
  get_current_user_role() IN ('admin', 'lawyer', 'staff') 
  AND company_id IN (
    SELECT profiles.company_id 
    FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);

CREATE POLICY "Users can update invites from their company" 
ON public.client_invites 
FOR UPDATE 
USING (company_id IN (
  SELECT profiles.company_id 
  FROM profiles 
  WHERE profiles.id = auth.uid()
));

-- Função para gerar token único
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Índices para performance
CREATE INDEX idx_client_invites_token ON public.client_invites(token);
CREATE INDEX idx_client_invites_email ON public.client_invites(email);
CREATE INDEX idx_client_invites_company_id ON public.client_invites(company_id);