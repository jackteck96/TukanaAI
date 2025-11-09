-- Criar tabela de clientes com dados completos
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Dados básicos da empresa cliente
  company_name TEXT NOT NULL,
  cnpj TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Endereço da sede
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zipcode TEXT,
  
  -- Dados do sócio administrador
  admin_full_name TEXT,
  admin_cpf TEXT,
  
  -- Método de qualificação e envio
  qualification_method TEXT NOT NULL DEFAULT 'company_fills', -- 'company_fills' ou 'client_fills'
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Status do cadastro
  registration_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'awaiting_client', 'completed', 'qualified'
  
  -- Observações internas
  internal_notes TEXT,
  
  -- Datas de controle
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Índices
  CONSTRAINT clients_email_company_unique UNIQUE(email, company_id)
);

-- Habilitar RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Empresa pode ver seus clientes"
  ON public.clients
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Empresa pode criar clientes"
  ON public.clients
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Empresa pode atualizar seus clientes"
  ON public.clients
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Empresa pode excluir seus clientes"
  ON public.clients
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at_trigger
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- Índices para performance
CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_registration_status ON public.clients(registration_status);