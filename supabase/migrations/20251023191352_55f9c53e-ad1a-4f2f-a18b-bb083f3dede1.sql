-- Create table for terms of service
CREATE TABLE IF NOT EXISTS public.terms_of_service (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create table for terms acceptance
CREATE TABLE IF NOT EXISTS public.terms_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  terms_id UUID NOT NULL REFERENCES public.terms_of_service(id),
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.terms_of_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for terms_of_service
CREATE POLICY "Anyone can view active terms"
  ON public.terms_of_service
  FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Only platform admins can manage terms"
  ON public.terms_of_service
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'platform_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'platform_admin'
    )
  );

-- RLS Policies for terms_acceptances
CREATE POLICY "Users can view their own acceptances"
  ON public.terms_acceptances
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can record their acceptances"
  ON public.terms_acceptances
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_terms_active ON public.terms_of_service(is_active, created_at DESC);
CREATE INDEX idx_terms_acceptances_user ON public.terms_acceptances(user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_terms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_terms_of_service_updated_at
  BEFORE UPDATE ON public.terms_of_service
  FOR EACH ROW
  EXECUTE FUNCTION update_terms_updated_at();

-- Insert default terms
INSERT INTO public.terms_of_service (version, content, is_active)
VALUES (
  '1.0',
  E'# TERMOS DE USO DA PLATAFORMA FUZEN\n\n## 1. ACEITAÇÃO DOS TERMOS\n\nAo utilizar a plataforma Fuzen, você concorda com estes Termos de Uso.\n\n## 2. DESCRIÇÃO DO SERVIÇO\n\nA Fuzen é uma plataforma de gestão e armazenamento de documentos.\n\n## 3. RESPONSABILIDADES DO USUÁRIO\n\n- Manter a confidencialidade de suas credenciais\n- Não utilizar o serviço para fins ilícitos\n- Respeitar direitos autorais e propriedade intelectual\n\n## 4. PRIVACIDADE E SEGURANÇA\n\nSeus dados são protegidos conforme nossa Política de Privacidade.\n\n## 5. PROPRIEDADE INTELECTUAL\n\nTodo o conteúdo da plataforma é protegido por direitos autorais.\n\n## 6. LIMITAÇÃO DE RESPONSABILIDADE\n\nA Fuzen não se responsabiliza por danos indiretos decorrentes do uso da plataforma.\n\n## 7. MODIFICAÇÕES\n\nPodemos modificar estes termos a qualquer momento.\n\n## 8. LEI APLICÁVEL\n\nEstes termos são regidos pelas leis brasileiras.\n\n## 9. CONTATO\n\nPara dúvidas, entre em contato através de contato@fuzen.online.',
  true
);