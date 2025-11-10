-- Criar tabela para relacionamento muitos-para-muitos entre processos e clientes
CREATE TABLE IF NOT EXISTS public.process_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  cpf_cnpj TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_process_clients_process_id ON public.process_clients(process_id);
CREATE INDEX idx_process_clients_email ON public.process_clients(client_email);

-- Habilitar RLS
ALTER TABLE public.process_clients ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para process_clients
CREATE POLICY "Users can view clients from authorized processes"
  ON public.process_clients FOR SELECT
  USING (
    can_access_process(process_id) AND 
    (EXISTS (
      SELECT 1 FROM processes p 
      WHERE p.id = process_clients.process_id 
      AND p.company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    ))
  );

CREATE POLICY "Users can create clients for authorized processes"
  ON public.process_clients FOR INSERT
  WITH CHECK (
    can_access_process(process_id) AND 
    (EXISTS (
      SELECT 1 FROM processes p 
      WHERE p.id = process_clients.process_id 
      AND p.company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    ))
  );

CREATE POLICY "Users can update clients from authorized processes"
  ON public.process_clients FOR UPDATE
  USING (
    can_access_process(process_id) AND 
    (EXISTS (
      SELECT 1 FROM processes p 
      WHERE p.id = process_clients.process_id 
      AND p.company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    ))
  );

CREATE POLICY "Users can delete clients from authorized processes"
  ON public.process_clients FOR DELETE
  USING (
    can_access_process(process_id) AND 
    (EXISTS (
      SELECT 1 FROM processes p 
      WHERE p.id = process_clients.process_id 
      AND p.company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    ))
  );

-- Migrar dados existentes da tabela processes para process_clients
INSERT INTO public.process_clients (process_id, client_name, client_email, cpf_cnpj, is_primary)
SELECT 
  id,
  client_name,
  client_email,
  cpf_cnpj,
  true -- marcar como cliente primário
FROM processes
WHERE client_email IS NOT NULL AND client_email != ''
ON CONFLICT DO NOTHING;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_process_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_process_clients_updated_at
  BEFORE UPDATE ON public.process_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_process_clients_updated_at();