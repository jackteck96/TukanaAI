-- Tabela de consentimentos LGPD/GDPR
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL, -- 'terms', 'privacy', 'marketing', 'data_processing', 'third_party_sharing'
  purpose TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE,
  revoked_date TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  user_agent TEXT,
  version TEXT NOT NULL, -- versão do documento aceito
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX idx_user_consents_type ON public.user_consents(consent_type);
CREATE INDEX idx_user_consents_date ON public.user_consents(consent_date);

-- Tabela de solicitações de direitos do titular (LGPD Art. 18)
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL, -- 'access', 'correction', 'deletion', 'portability', 'revoke_consent', 'anonymization'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'rejected'
  request_details JSONB,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  rejection_reason TEXT,
  export_file_path TEXT, -- para solicitações de portabilidade
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_data_subject_requests_user_id ON public.data_subject_requests(user_id);
CREATE INDEX idx_data_subject_requests_status ON public.data_subject_requests(status);
CREATE INDEX idx_data_subject_requests_type ON public.data_subject_requests(request_type);

-- Tabela de logs de acesso a dados pessoais (LGPD Art. 37)
CREATE TABLE IF NOT EXISTS public.personal_data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_user_id UUID NOT NULL, -- usuário cujos dados foram acessados
  accessor_user_id UUID, -- usuário que acessou (pode ser NULL para processos automáticos)
  access_type TEXT NOT NULL, -- 'view', 'edit', 'export', 'delete'
  data_category TEXT NOT NULL, -- 'profile', 'documents', 'processes', 'all'
  purpose TEXT NOT NULL, -- justificativa legal do acesso
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

CREATE INDEX idx_personal_data_access_log_accessed_user ON public.personal_data_access_log(accessed_user_id);
CREATE INDEX idx_personal_data_access_log_accessor ON public.personal_data_access_log(accessor_user_id);
CREATE INDEX idx_personal_data_access_log_date ON public.personal_data_access_log(accessed_at);

-- Tabela de políticas de privacidade (versionamento)
CREATE TABLE IF NOT EXISTS public.privacy_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de incidentes de segurança (LGPD Art. 48)
CREATE TABLE IF NOT EXISTS public.security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type TEXT NOT NULL, -- 'data_breach', 'unauthorized_access', 'data_loss', 'system_compromise'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT NOT NULL,
  affected_users_count INTEGER DEFAULT 0,
  affected_data_categories TEXT[],
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reported_to_anpd BOOLEAN DEFAULT false,
  reported_at TIMESTAMP WITH TIME ZONE,
  users_notified BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  resolution_status TEXT DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
  resolution_details TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX idx_security_incidents_status ON public.security_incidents(resolution_status);
CREATE INDEX idx_security_incidents_detected ON public.security_incidents(detected_at);

-- Enable RLS em todas as tabelas
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_data_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_consents
CREATE POLICY "Users can view their own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents"
  ON public.user_consents FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

-- Políticas RLS para data_subject_requests
CREATE POLICY "Users can view their own requests"
  ON public.data_subject_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests"
  ON public.data_subject_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.data_subject_requests FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Admins can update requests"
  ON public.data_subject_requests FOR UPDATE
  USING (public.is_platform_admin(auth.uid()));

-- Políticas RLS para personal_data_access_log
CREATE POLICY "Users can view logs about their data"
  ON public.personal_data_access_log FOR SELECT
  USING (auth.uid() = accessed_user_id);

CREATE POLICY "Admins can view all access logs"
  ON public.personal_data_access_log FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "System can insert access logs"
  ON public.personal_data_access_log FOR INSERT
  WITH CHECK (true);

-- Políticas RLS para privacy_policies (público para leitura)
CREATE POLICY "Everyone can view active privacy policy"
  ON public.privacy_policies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage privacy policies"
  ON public.privacy_policies FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- Políticas RLS para security_incidents (apenas admins)
CREATE POLICY "Admins can manage security incidents"
  ON public.security_incidents FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_subject_requests_updated_at
  BEFORE UPDATE ON public.data_subject_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_privacy_policies_updated_at
  BEFORE UPDATE ON public.privacy_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_incidents_updated_at
  BEFORE UPDATE ON public.security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para registrar acesso a dados pessoais
CREATE OR REPLACE FUNCTION public.log_personal_data_access(
  p_accessed_user_id UUID,
  p_access_type TEXT,
  p_data_category TEXT,
  p_purpose TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.personal_data_access_log (
    accessed_user_id,
    accessor_user_id,
    access_type,
    data_category,
    purpose,
    ip_address,
    metadata
  ) VALUES (
    p_accessed_user_id,
    auth.uid(),
    p_access_type,
    p_data_category,
    p_purpose,
    inet_client_addr(),
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Comentários para documentação
COMMENT ON TABLE public.user_consents IS 'Registro de consentimentos LGPD/GDPR com versionamento';
COMMENT ON TABLE public.data_subject_requests IS 'Solicitações de direitos dos titulares (LGPD Art. 18)';
COMMENT ON TABLE public.personal_data_access_log IS 'Logs de acesso a dados pessoais (LGPD Art. 37)';
COMMENT ON TABLE public.privacy_policies IS 'Versionamento de políticas de privacidade';
COMMENT ON TABLE public.security_incidents IS 'Registro de incidentes de segurança (LGPD Art. 48)';