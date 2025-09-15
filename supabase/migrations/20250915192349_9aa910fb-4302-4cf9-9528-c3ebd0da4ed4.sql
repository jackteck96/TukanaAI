-- Criar tabela para assinaturas digitais internas
CREATE TABLE public.internal_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  process_id UUID NOT NULL,
  company_id UUID NOT NULL,
  signer_id UUID NOT NULL,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  authentication_method TEXT NOT NULL CHECK (authentication_method IN ('email', 'sms')),
  authentication_contact TEXT NOT NULL, -- email ou telefone usado
  signature_hash TEXT NOT NULL UNIQUE,
  signature_ip INET,
  document_hash TEXT NOT NULL, -- hash do documento para integridade
  signature_metadata JSONB NOT NULL DEFAULT '{}',
  signature_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para verificações OTP
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  user_id UUID NOT NULL,
  contact TEXT NOT NULL, -- email ou telefone
  verification_code TEXT NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('email', 'sms')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internal_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies para internal_signatures
CREATE POLICY "Users can create signatures for authorized processes"
ON public.internal_signatures
FOR INSERT 
WITH CHECK (
  can_access_process(process_id) AND 
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can view signatures from authorized processes"
ON public.internal_signatures
FOR SELECT
USING (
  can_access_process(process_id) AND 
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- RLS Policies para otp_verifications
CREATE POLICY "Users can create OTP for authorized documents"
ON public.otp_verifications
FOR INSERT 
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY "Users can view their own OTP verifications"
ON public.otp_verifications
FOR SELECT
USING (
  user_id = auth.uid()
);

CREATE POLICY "Users can update their own OTP verifications"
ON public.otp_verifications
FOR UPDATE
USING (
  user_id = auth.uid()
);

-- Função para gerar hash de assinatura
CREATE OR REPLACE FUNCTION public.generate_signature_hash(
  document_uuid UUID,
  signer_uuid UUID,
  timestamp_val TIMESTAMP WITH TIME ZONE
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN encode(
    digest(
      document_uuid::text || 
      signer_uuid::text || 
      extract(epoch from timestamp_val)::text || 
      'internal_signature_salt',
      'sha256'
    ),
    'hex'
  );
END;
$$;

-- Função para gerar hash do documento
CREATE OR REPLACE FUNCTION public.generate_document_hash(
  document_uuid UUID,
  file_path_val TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN encode(
    digest(
      document_uuid::text || 
      file_path_val || 
      'document_integrity_salt',
      'sha256'
    ),
    'hex'
  );
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_internal_signatures_updated_at
  BEFORE UPDATE ON public.internal_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_internal_signatures_document_id ON public.internal_signatures(document_id);
CREATE INDEX idx_internal_signatures_process_id ON public.internal_signatures(process_id);
CREATE INDEX idx_otp_verifications_document_user ON public.otp_verifications(document_id, user_id);
CREATE INDEX idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);