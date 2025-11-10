-- Adicionar campos para qualificação jurídica nas empresas
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS legal_representative_name TEXT,
ADD COLUMN IF NOT EXISTS legal_representative_cpf TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Criar tabela para dados completos dos clientes (qualificação jurídica)
CREATE TABLE IF NOT EXISTS public.client_legal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_email TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  person_type TEXT NOT NULL DEFAULT 'pf', -- 'pf' ou 'pj'
  
  -- Dados comuns
  phone TEXT,
  email TEXT,
  address TEXT,
  
  -- Dados PF (Pessoa Física)
  cpf TEXT,
  rg TEXT,
  nationality TEXT DEFAULT 'brasileiro(a)',
  marital_status TEXT,
  profession TEXT,
  
  -- Dados PJ (Pessoa Jurídica)
  cnpj TEXT,
  company_name TEXT,
  legal_representative_name TEXT,
  legal_representative_cpf TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  company_id UUID REFERENCES public.companies(id)
);

-- Habilitar RLS
ALTER TABLE public.client_legal_data ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para client_legal_data
CREATE POLICY "Company staff can view their clients legal data"
ON public.client_legal_data
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Company staff can insert their clients legal data"
ON public.client_legal_data
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Company staff can update their clients legal data"
ON public.client_legal_data
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Clients can view their own legal data"
ON public.client_legal_data
FOR SELECT
USING (
  client_email = (
    SELECT email FROM profiles WHERE id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_client_legal_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_legal_data_updated_at
BEFORE UPDATE ON public.client_legal_data
FOR EACH ROW
EXECUTE FUNCTION update_client_legal_data_updated_at();

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_client_legal_data_email ON public.client_legal_data(client_email);
CREATE INDEX IF NOT EXISTS idx_client_legal_data_company ON public.client_legal_data(company_id);