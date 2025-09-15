-- Criar tabela para assinaturas digitais
CREATE TABLE public.digital_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  process_id UUID NOT NULL,
  company_id UUID NOT NULL,
  signer_cpf TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  certificate_serial TEXT NOT NULL,
  certificate_issuer TEXT NOT NULL,
  certificate_subject TEXT NOT NULL,
  signature_hash TEXT NOT NULL,
  signature_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  gov_br_access_token TEXT,
  signature_order INTEGER NOT NULL DEFAULT 1,
  signature_status TEXT NOT NULL DEFAULT 'pending' CHECK (signature_status IN ('pending', 'signed', 'rejected', 'expired')),
  signature_metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para controle de fluxo de assinaturas
CREATE TABLE public.signature_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  process_id UUID NOT NULL,
  company_id UUID NOT NULL,
  flow_type TEXT NOT NULL DEFAULT 'sequential' CHECK (flow_type IN ('sequential', 'parallel')),
  current_step INTEGER NOT NULL DEFAULT 1,
  total_steps INTEGER NOT NULL DEFAULT 1,
  flow_status TEXT NOT NULL DEFAULT 'active' CHECK (flow_status IN ('active', 'completed', 'cancelled')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para governança de assinaturas
CREATE TABLE public.signature_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signature_flow_id UUID NOT NULL,
  signer_email TEXT NOT NULL,
  signer_name TEXT,
  signature_order INTEGER NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índices para performance
CREATE INDEX idx_digital_signatures_document_id ON public.digital_signatures(document_id);
CREATE INDEX idx_digital_signatures_process_id ON public.digital_signatures(process_id);
CREATE INDEX idx_digital_signatures_company_id ON public.digital_signatures(company_id);
CREATE INDEX idx_digital_signatures_signer_cpf ON public.digital_signatures(signer_cpf);
CREATE INDEX idx_signature_flows_document_id ON public.signature_flows(document_id);
CREATE INDEX idx_signature_requirements_flow_id ON public.signature_requirements(signature_flow_id);

-- Habilitar RLS nas tabelas
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_requirements ENABLE ROW LEVEL SECURITY;

-- Políticas para digital_signatures
CREATE POLICY "Users can view signatures from authorized processes" 
ON public.digital_signatures 
FOR SELECT 
USING (can_access_process(process_id) AND company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can create signatures for authorized processes" 
ON public.digital_signatures 
FOR INSERT 
WITH CHECK (can_access_process(process_id) AND company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can update signatures from authorized processes" 
ON public.digital_signatures 
FOR UPDATE 
USING (can_access_process(process_id) AND company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

-- Políticas para signature_flows
CREATE POLICY "Users can view flows from authorized processes" 
ON public.signature_flows 
FOR SELECT 
USING (can_access_process(process_id) AND company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can create flows for authorized processes" 
ON public.signature_flows 
FOR INSERT 
WITH CHECK (can_access_process(process_id) AND company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Users can update flows from authorized processes" 
ON public.signature_flows 
FOR UPDATE 
USING (can_access_process(process_id) AND company_id IN (
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
));

-- Políticas para signature_requirements
CREATE POLICY "Users can view requirements from authorized flows" 
ON public.signature_requirements 
FOR SELECT 
USING (signature_flow_id IN (
  SELECT id FROM public.signature_flows 
  WHERE can_access_process(process_id) AND company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
));

CREATE POLICY "Users can create requirements for authorized flows" 
ON public.signature_requirements 
FOR INSERT 
WITH CHECK (signature_flow_id IN (
  SELECT id FROM public.signature_flows 
  WHERE can_access_process(process_id) AND company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
));

CREATE POLICY "Users can update requirements from authorized flows" 
ON public.signature_requirements 
FOR UPDATE 
USING (signature_flow_id IN (
  SELECT id FROM public.signature_flows 
  WHERE can_access_process(process_id) AND company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
));

-- Trigger para atualizar timestamp
CREATE TRIGGER update_digital_signatures_updated_at
BEFORE UPDATE ON public.digital_signatures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_signature_flows_updated_at
BEFORE UPDATE ON public.signature_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar se é possível assinar documento
CREATE OR REPLACE FUNCTION public.can_sign_document(document_uuid uuid, signer_email_param text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  flow_record RECORD;
  requirement_record RECORD;
  current_signatures INTEGER;
BEGIN
  -- Buscar o fluxo ativo para o documento
  SELECT * INTO flow_record
  FROM public.signature_flows
  WHERE document_id = document_uuid AND flow_status = 'active';
  
  -- Se não há fluxo, não pode assinar
  IF flow_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se o signatário está na lista de requerimentos
  SELECT * INTO requirement_record
  FROM public.signature_requirements
  WHERE signature_flow_id = flow_record.id AND signer_email = signer_email_param;
  
  -- Se não está na lista, não pode assinar
  IF requirement_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Para fluxo sequencial, verificar se é a vez do signatário
  IF flow_record.flow_type = 'sequential' THEN
    -- Contar quantas assinaturas já foram feitas
    SELECT COUNT(*) INTO current_signatures
    FROM public.digital_signatures
    WHERE document_id = document_uuid AND signature_status = 'signed';
    
    -- Verificar se é a ordem correta
    IF requirement_record.signature_order != (current_signatures + 1) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Para fluxo paralelo, qualquer signatário pode assinar a qualquer momento
  RETURN TRUE;
END;
$$;